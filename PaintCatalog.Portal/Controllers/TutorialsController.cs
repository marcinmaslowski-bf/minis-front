using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaintCatalog.Portal.ApiClients;
using PaintCatalog.Portal.Models.Api;
using PaintCatalog.Portal.Models.Tutorials;

namespace PaintCatalog.Portal.Controllers
{
    [Authorize]
    [Route("tutorials")]
    public class TutorialsController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true
        };

        public TutorialsController(IPaintCatalogApiClient apiClient)
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

            var vm = new TutorialsIndexViewModel();

            try
            {
                vm.RawJson = await _apiClient.GetTutorialsRawAsync(userId);
                vm.Tutorials = ParseTutorialList(vm.RawJson);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, $"Failed to load tutorials: {ex.Message}");
            }

            return View(vm);
        }

        [HttpGet("create")]
        public IActionResult Create()
        {
            var vm = new TutorialEditViewModel
            {
                ContentJson = JsonSerializer.Serialize(new EditorJsDocumentDto
                {
                    Time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    Version = "3.0.0",
                    Sections = new List<TutorialSectionDto>
                    {
                        new TutorialSectionDto
                        {
                            Title = "Intro",
                            Items = new List<TutorialSectionItemDto>
                            {
                                new TutorialSectionItemDto
                                {
                                    Type = "text",
                                    Text = "Add your tutorial steps here.",
                                    PaintIds = new List<int>()
                                }
                            }
                        }
                    }
                }, JsonOptions)
            };

            return View("Edit", vm);
        }

        [HttpPost("create")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(TutorialEditViewModel model, string? submitAction)
        {
            ValidateContent(model);

            if (!ModelState.IsValid)
            {
                return View("Edit", model);
            }

            var publishRequested = string.Equals(submitAction, "publish", StringComparison.OrdinalIgnoreCase);

            var request = new CreateTutorialRequest
            {
                Title = model.Title?.Trim(),
                TitleImageAttachmentId = model.TitleImageAttachmentId!.Value,
                Content = DeserializeContent(model.ContentJson!),
                Published = publishRequested && model.IsEdit
            };

            try
            {
                await _apiClient.CreateTutorialAsync(request);
                return RedirectToAction(nameof(Index));
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, $"Failed to create tutorial: {ex.Message}");
                return View("Edit", model);
            }
        }

        [HttpGet("{id:int}/edit")]
        public async Task<IActionResult> Edit(int id)
        {
            var tutorial = await GetTutorialAsync(id);
            if (tutorial == null)
            {
                return NotFound();
            }

            var vm = new TutorialEditViewModel
            {
                Id = tutorial.Id,
                Title = tutorial.Title,
                TitleImageAttachmentId = tutorial.TitleImageAttachmentId,
                ContentJson = JsonSerializer.Serialize(tutorial.Content ?? new EditorJsDocumentDto(), JsonOptions),
                Published = tutorial.Published
            };

            return View(vm);
        }

        [HttpPost("{id:int}/edit")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, TutorialEditViewModel model, string? submitAction)
        {
            model.Id = id;
            ValidateContent(model);

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var request = new UpdateTutorialRequest
            {
                Title = model.Title?.Trim(),
                TitleImageAttachmentId = model.TitleImageAttachmentId!.Value,
                Content = DeserializeContent(model.ContentJson!),
                Published = ShouldPublish(submitAction, model)
            };

            try
            {
                await _apiClient.UpdateTutorialAsync(id, request);
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
                ModelState.AddModelError(string.Empty, $"Failed to update tutorial: {ex.Message}");
                return View(model);
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Details(int id)
        {
            var tutorial = await GetTutorialAsync(id);
            if (tutorial == null)
            {
                return NotFound();
            }

            var vm = new TutorialDetailsViewModel
            {
                Id = tutorial.Id,
                Title = tutorial.Title ?? string.Empty,
                TitleImageAttachmentId = tutorial.TitleImageAttachmentId,
                Content = tutorial.Content ?? new EditorJsDocumentDto(),
                ContentJson = JsonSerializer.Serialize(tutorial.Content ?? new EditorJsDocumentDto(), JsonOptions),
                Published = tutorial.Published,
                CreatedAtUtc = tutorial.CreatedAtUtc,
                UpdatedAtUtc = tutorial.UpdatedAtUtc,
                Bookmark = tutorial.Bookmark
            };

            return View(vm);
        }

        [HttpPost("{id:int}/delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _apiClient.DeleteTutorialAsync(id);
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
                TempData["Error"] = $"Failed to delete tutorial: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        private async Task<TutorialDto?> GetTutorialAsync(int id)
        {
            try
            {
                var payload = await _apiClient.GetTutorialByIdAsync(id);
                return JsonSerializer.Deserialize<TutorialDto>(payload, JsonOptions);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        private static List<TutorialListItem> ParseTutorialList(string? rawJson)
        {
            var result = new List<TutorialListItem>();

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
                    var dto = JsonSerializer.Deserialize<TutorialDto>(element.GetRawText(), JsonOptions);
                    if (dto == null)
                    {
                        continue;
                    }

                    result.Add(new TutorialListItem
                    {
                        Id = dto.Id,
                        Title = dto.Title ?? $"Tutorial #{dto.Id}",
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

        private static bool ShouldPublish(string? submitAction, TutorialEditViewModel model)
        {
            var publishRequested = string.Equals(submitAction, "publish", StringComparison.OrdinalIgnoreCase);
            return publishRequested || model.Published;
        }

        private void ValidateContent(TutorialEditViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Title))
            {
                ModelState.AddModelError(nameof(model.Title), "Title is required");
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
    }
}
