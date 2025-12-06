using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using PaintCatalog.Portal.ApiClients;
using PaintCatalog.Portal.Models.Api;
using PaintCatalog.Portal.Models.Articles;

namespace PaintCatalog.Portal.Controllers
{
    [Authorize]
    [Route("articles")]
    public class ArticlesController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true
        };

        private static readonly Dictionary<ContentType, string> ContentTypeLabels = new()
        {
            { ContentType.Tutorial, "Tutorial" },
            { ContentType.BattleReport, "BattleReport" },
            { ContentType.Review, "Review" },
            { ContentType.Event, "Event" },
            { ContentType.News, "News" }
        };

        public ArticlesController(IPaintCatalogApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Forbid();
            }

            var vm = new ArticlesIndexViewModel();

            try
            {
                vm.RawJson = await _apiClient.GetArticlesRawAsync(userId);
                vm.Articles = ParseArticleList(vm.RawJson);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, $"Failed to load articles: {ex.Message}");
            }

            return View(vm);
        }

        [HttpGet("create")]
        public IActionResult Create()
        {
            var vm = new ArticleEditViewModel
            {
                SelectedContentTypes = new List<int> { (int)ContentType.Tutorial },
                ContentJson = JsonSerializer.Serialize(new EditorJsDocumentDto
                {
                    Time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    Version = "3.0.0",
                    Sections = new List<ArticleSectionDto>
                    {
                        new ArticleSectionDto
                        {
                            Title = "Intro",
                            Items = new List<ArticleSectionItemDto>
                            {
                                new ArticleSectionItemDto
                                {
                                    Type = "text",
                                    Text = "Add your article steps here.",
                                    PaintIds = new List<int>()
                                }
                            }
                        }
                    }
                }, JsonOptions)
            };

            EnsureContentTypeOptions(vm);
            return View("Edit", vm);
        }

        [HttpPost("create")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(ArticleEditViewModel model, string? submitAction)
        {
            model.SelectedContentTypes ??= new List<int>();
            EnsureContentTypeOptions(model);
            ValidateContent(model);

            if (!ModelState.IsValid)
            {
                return View("Edit", model);
            }

            var publishRequested = string.Equals(submitAction, "publish", StringComparison.OrdinalIgnoreCase);

            var request = new CreateArticleRequest
            {
                Title = model.Title?.Trim(),
                ContentType = CombineContentTypes(model.SelectedContentTypes),
                TitleImageAttachmentId = model.TitleImageAttachmentId!.Value,
                Content = DeserializeContent(model.ContentJson!),
                Published = publishRequested && model.IsEdit
            };

            try
            {
                await _apiClient.CreateArticleAsync(request);
                return RedirectToAction(nameof(Index));
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, $"Failed to create article: {ex.Message}");
                return View("Edit", model);
            }
        }

        [HttpGet("{id:int}/edit")]
        public async Task<IActionResult> Edit(int id)
        {
            var article = await GetArticleAsync(id);
            if (article == null)
            {
                return NotFound();
            }

            var vm = new ArticleEditViewModel
            {
                Id = article.Id,
                Title = article.Title,
                SelectedContentTypes = SplitContentTypes(article.ContentType),
                TitleImageAttachmentId = article.TitleImageAttachmentId,
                ContentJson = JsonSerializer.Serialize(article.Content ?? new EditorJsDocumentDto(), JsonOptions),
                Published = article.Published
            };

            EnsureContentTypeOptions(vm);
            return View(vm);
        }

        [HttpPost("{id:int}/edit")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, ArticleEditViewModel model, string? submitAction)
        {
            model.Id = id;
            model.SelectedContentTypes ??= new List<int>();
            EnsureContentTypeOptions(model);
            ValidateContent(model);

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var request = new UpdateArticleRequest
            {
                Title = model.Title?.Trim(),
                ContentType = CombineContentTypes(model.SelectedContentTypes),
                TitleImageAttachmentId = model.TitleImageAttachmentId!.Value,
                Content = DeserializeContent(model.ContentJson!),
                Published = ShouldPublish(submitAction, model)
            };

            try
            {
                await _apiClient.UpdateArticleAsync(id, request);
                return RedirectToAction(nameof(Index));
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, $"Failed to update article: {ex.Message}");
                return View(model);
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Details(int id)
        {
            var article = await GetArticleAsync(id);
            if (article == null)
            {
                return NotFound();
            }

            var vm = new ArticleDetailsViewModel
            {
                Id = article.Id,
                Title = article.Title ?? string.Empty,
                ContentType = article.ContentType,
                TitleImageAttachmentId = article.TitleImageAttachmentId,
                Content = article.Content ?? new EditorJsDocumentDto(),
                ContentJson = JsonSerializer.Serialize(article.Content ?? new EditorJsDocumentDto(), JsonOptions),
                Published = article.Published,
                CreatedAtUtc = article.CreatedAtUtc,
                UpdatedAtUtc = article.UpdatedAtUtc,
                Bookmark = article.Bookmark
            };

            return View(vm);
        }

        [HttpPost("{id:int}/delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _apiClient.DeleteArticleAsync(id);
                return RedirectToAction(nameof(Index));
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                TempData["Error"] = $"Failed to delete article: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        private async Task<ArticleDto?> GetArticleAsync(int id)
        {
            try
            {
                var payload = await _apiClient.GetArticleByIdAsync(id);
                return JsonSerializer.Deserialize<ArticleDto>(payload, JsonOptions);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        private static List<ArticleListItem> ParseArticleList(string? rawJson)
        {
            var result = new List<ArticleListItem>();

            if (string.IsNullOrWhiteSpace(rawJson))
            {
                return result;
            }

            try
            {
                using var document = JsonDocument.Parse(rawJson);
                var root = document.RootElement;
                var listElement = root;

                if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("items", out var itemsElement))
                {
                    listElement = itemsElement;
                }

                if (listElement.ValueKind != JsonValueKind.Array)
                {
                    return result;
                }

                foreach (var element in listElement.EnumerateArray())
                {
                    var dto = JsonSerializer.Deserialize<ArticleDto>(element.GetRawText(), JsonOptions);
                    if (dto == null)
                    {
                        continue;
                    }

                    result.Add(new ArticleListItem
                    {
                        Id = dto.Id,
                        Title = dto.Title ?? $"Article #{dto.Id}",
                        Published = dto.Published,
                        CreatedAtUtc = dto.CreatedAtUtc,
                        UpdatedAtUtc = dto.UpdatedAtUtc
                    });
                }
            }
            catch
            {
                // Ignore parse errors; the raw JSON will still be displayed.
            }

            return result;
        }

        private static bool ShouldPublish(string? submitAction, ArticleEditViewModel model)
        {
            var publishRequested = string.Equals(submitAction, "publish", StringComparison.OrdinalIgnoreCase);
            return publishRequested || model.Published;
        }

        private void ValidateContent(ArticleEditViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Title))
            {
                ModelState.AddModelError(nameof(model.Title), "Title is required");
            }

            if (model.SelectedContentTypes == null || model.SelectedContentTypes.Count == 0)
            {
                ModelState.AddModelError(nameof(model.SelectedContentTypes), "At least one content type is required");
            }

            if (!model.TitleImageAttachmentId.HasValue || model.TitleImageAttachmentId.Value <= 0)
            {
                ModelState.AddModelError(nameof(model.TitleImageAttachmentId), "Valid title image attachment ID is required");
            }

            if (string.IsNullOrWhiteSpace(model.ContentJson))
            {
                ModelState.AddModelError(nameof(model.ContentJson), "Content JSON is required");
                return;
            }

            try
            {
                // Ensure JSON is valid and matches the expected contract.
                _ = DeserializeContent(model.ContentJson);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(nameof(model.ContentJson), $"Invalid content JSON: {ex.Message}");
            }
        }

        private static EditorJsDocumentDto DeserializeContent(string json)
        {
            var content = JsonSerializer.Deserialize<EditorJsDocumentDto>(json, JsonOptions);
            if (content == null)
            {
                throw new InvalidOperationException("Content cannot be empty");
            }

            return content;
        }

        private static ContentType CombineContentTypes(IEnumerable<int> selectedTypes)
        {
            ContentType result = 0;
            foreach (var value in selectedTypes)
            {
                result |= (ContentType)value;
            }

            return result;
        }

        private static List<int> SplitContentTypes(ContentType contentType)
        {
            return Enum.GetValues<ContentType>()
                .Where(type => contentType.HasFlag(type))
                .Select(type => (int)type)
                .ToList();
        }

        private void EnsureContentTypeOptions(ArticleEditViewModel model)
        {
            model.ContentTypeOptions = BuildContentTypeOptions(model.SelectedContentTypes ?? new List<int>());
        }

        private List<SelectListItem> BuildContentTypeOptions(IEnumerable<int> selectedValues)
        {
            var selectedSet = new HashSet<int>(selectedValues);

            var items = new List<SelectListItem>();

            foreach (var (type, label) in ContentTypeLabels)
            {
                items.Add(new SelectListItem
                {
                    Value = ((int)type).ToString(),
                    Text = label,
                    Selected = selectedSet.Contains((int)type)
                });
            }

            return items;
        }
    }
}
