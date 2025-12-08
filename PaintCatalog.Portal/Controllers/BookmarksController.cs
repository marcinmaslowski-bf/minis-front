using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaintCatalog.Portal.ApiClients;
using PaintCatalog.Portal.Models.Api;

namespace PaintCatalog.Portal.Controllers
{
    [Authorize]
    [Route("bookmarks")]
    public class BookmarksController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public BookmarksController(IPaintCatalogApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            var vm = new Models.Bookmarks.BookmarkListViewModel
            {
                BookmarksEndpoint = Url.Action("List", "Bookmarks") ?? "/bookmarks/list"
            };

            return View(vm);
        }

        [HttpGet("categories")]
        public async Task<IActionResult> Categories(BookmarkItemType? itemType)
        {
            try
            {
                var payload = await _apiClient.GetBookmarkCategoriesAsync(itemType);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Failed to load bookmark categories", detail = ex.Message });
            }
        }

        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            try
            {
                var payload = await _apiClient.GetBookmarksAsync();
                var enrichedPayload = await EnrichPaintBookmarksAsync(payload);

                enrichedPayload = await EnrichArticleBookmarksAsync(enrichedPayload);

                return Content(enrichedPayload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Failed to load bookmarks", detail = ex.Message });
            }
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateBookmarkCategoryRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { error = "Category name is required" });
            }

            try
            {
                var payload = await _apiClient.CreateBookmarkCategoryAsync(request);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Failed to create bookmark category", detail = ex.Message });
            }
        }

        [HttpGet("{itemType:int}/{itemId:int}")]
        public async Task<IActionResult> Get(BookmarkItemType itemType, int itemId)
        {
            try
            {
                var payload = await _apiClient.GetBookmarkAsync(itemType, itemId);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Failed to load bookmark", detail = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Upsert([FromBody] UpsertBookmarkRequest request)
        {
            if (request == null || request.CategoryId <= 0)
            {
                return BadRequest(new { error = "Valid category is required" });
            }

            try
            {
                var payload = await _apiClient.UpsertBookmarkAsync(request);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Failed to save bookmark", detail = ex.Message });
            }
        }

        [HttpDelete("{itemType:int}/{itemId:int}")]
        public async Task<IActionResult> Delete(BookmarkItemType itemType, int itemId)
        {
            try
            {
                var payload = await _apiClient.DeleteBookmarkAsync(itemType, itemId);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (HttpRequestException ex) when (ex.StatusCode.HasValue)
            {
                return StatusCode((int)ex.StatusCode.Value, new { error = "Failed to remove bookmark", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Failed to remove bookmark", detail = ex.Message });
            }
        }

        private async Task<string> EnrichPaintBookmarksAsync(string payload)
        {
            if (string.IsNullOrWhiteSpace(payload))
            {
                return payload;
            }

            JsonNode? root;
            try
            {
                root = JsonNode.Parse(payload);
            }
            catch
            {
                return payload;
            }

            if (root is null)
            {
                return payload;
            }

            var bookmarkItems = ExtractBookmarkItems(root).ToList();
            var paintIds = bookmarkItems
                .Where(IsPaintItem)
                .Select(GetBookmarkItemId)
                .Where(id => id.HasValue && id.Value > 0)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            if (paintIds.Count == 0)
            {
                return payload;
            }

            Dictionary<int, PaintBookmarkInfo> paintData;
            try
            {
                paintData = await FetchPaintDataAsync(paintIds);
            }
            catch
            {
                return payload;
            }

            if (paintData.Count == 0)
            {
                return payload;
            }

            foreach (var bookmark in bookmarkItems)
            {
                var itemId = GetBookmarkItemId(bookmark);
                if (!itemId.HasValue || !paintData.TryGetValue(itemId.Value, out var paint))
                {
                    continue;
                }

                ApplyValue(bookmark, "brandSlug", paint.BrandSlug);
                ApplyValue(bookmark, "seriesSlug", paint.SeriesSlug);
                ApplyValue(bookmark, "paintSlug", paint.PaintSlug);

                if (paint.Paint is JsonObject paintObject)
                {
                    var item = bookmark["item"] as JsonObject;
                    if (item == null)
                    {
                        bookmark["item"] = CloneJsonObject(paintObject);
                    }
                    else
                    {
                        MergeJsonObjects(item, paintObject);
                    }

                    var paintTitle = GetString(paintObject, "name", "Name", "displayName");
                    ApplyValue(bookmark, "title", paintTitle);
                }

                var hasUrl = TryGetString(bookmark, out var existingUrl, "url", "link", "href") && !string.IsNullOrWhiteSpace(existingUrl);
                if (!hasUrl && paint.IsComplete)
                {
                    bookmark["url"] = $"/paints/{paint.BrandSlug}/{paint.SeriesSlug}/{paint.PaintSlug}";
                }
            }

            return root.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
        }

        private async Task<string> EnrichArticleBookmarksAsync(string payload)
        {
            if (string.IsNullOrWhiteSpace(payload))
            {
                return payload;
            }

            JsonNode? root;
            try
            {
                root = JsonNode.Parse(payload);
            }
            catch
            {
                return payload;
            }

            if (root is null)
            {
                return payload;
            }

            var bookmarkItems = ExtractBookmarkItems(root).Where(IsArticleItem).ToList();
            var articleIds = bookmarkItems
                .Select(GetBookmarkItemId)
                .Where(id => id.HasValue && id.Value > 0)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            if (articleIds.Count == 0)
            {
                return payload;
            }

            Dictionary<int, ArticleBookmarkInfo> articles;
            try
            {
                articles = await FetchArticleDataAsync(articleIds);
            }
            catch
            {
                return payload;
            }

            foreach (var bookmark in bookmarkItems)
            {
                var itemId = GetBookmarkItemId(bookmark);
                if (!itemId.HasValue || !articles.TryGetValue(itemId.Value, out var article))
                {
                    continue;
                }

                var canonicalSlug = BuildArticleSlug(article.Article, itemId.Value);
                bookmark["articleSlug"] = canonicalSlug;
                bookmark["url"] = $"/p/{canonicalSlug}-{itemId.Value}";

                if (article.Article?.ContentType is ContentType contentType)
                {
                    bookmark["contentType"] = (int)contentType;
                }

                if (article.ArticleJson != null)
                {
                    var item = bookmark["item"] as JsonObject;
                    if (item == null)
                    {
                        bookmark["item"] = CloneJsonObject(article.ArticleJson);
                    }
                    else
                    {
                        MergeJsonObjects(item, article.ArticleJson);
                    }
                }

                if (!string.IsNullOrWhiteSpace(article.Article?.Title))
                {
                    bookmark["title"] = article.Article!.Title;
                }
            }

            return root.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
        }

        private static IEnumerable<JsonObject> ExtractBookmarkItems(JsonNode root)
        {
            if (root is JsonArray rootArray)
            {
                return rootArray.OfType<JsonObject>();
            }

            if (root is JsonObject rootObject && rootObject["items"] is JsonArray itemsArray)
            {
                return itemsArray.OfType<JsonObject>();
            }

            return Enumerable.Empty<JsonObject>();
        }

        private async Task<Dictionary<int, PaintBookmarkInfo>> FetchPaintDataAsync(IEnumerable<int> paintIds)
        {
            var payload = await _apiClient.GetPaintsRawAsync(ids: paintIds);

            JsonNode? root;
            try
            {
                root = JsonNode.Parse(payload);
            }
            catch
            {
                return new Dictionary<int, PaintBookmarkInfo>();
            }

            var paintItems = new List<JsonObject>();

            if (root is JsonArray array)
            {
                paintItems.AddRange(array.OfType<JsonObject>());
            }
            else if (root is JsonObject obj && obj["items"] is JsonArray itemsArray)
            {
                paintItems.AddRange(itemsArray.OfType<JsonObject>());
            }

            var paintSlugs = new Dictionary<int, PaintBookmarkInfo>();

            foreach (var paint in paintItems)
            {
                var paintId = GetInt(paint, "id");
                if (!paintId.HasValue)
                {
                    continue;
                }

                var brandSlug = FindBrandSlug(paint);
                var seriesSlug = FindSeriesSlug(paint);
                var paintSlug = FindPaintSlug(paint);

                paintSlugs[paintId.Value] = new PaintBookmarkInfo(brandSlug, seriesSlug, paintSlug, CloneJsonObject(paint));
            }

            return paintSlugs;
        }

        private static string? FindBrandSlug(JsonObject paint)
        {
            var brandObject = paint["brand"] as JsonObject;
            var seriesObject = paint["series"] as JsonObject;
            var seriesBrandObject = seriesObject?["brand"] as JsonObject;

            return FirstNonEmpty(
                GetString(paint, "brandSlug", "brandUrlSlug"),
                GetSlug(brandObject),
                GetSlug(seriesBrandObject));
        }

        private static string? FindSeriesSlug(JsonObject paint)
        {
            var seriesObject = paint["series"] as JsonObject;

            return FirstNonEmpty(
                GetString(paint, "seriesSlug", "seriesUrlSlug"),
                GetSlug(seriesObject));
        }

        private static string? FindPaintSlug(JsonObject paint)
        {
            return FirstNonEmpty(
                GetString(paint, "paintSlug", "paintUrlSlug", "urlSlug", "urlslug", "slug"),
                GetSlug(paint));
        }

        private static string? GetSlug(JsonObject? obj)
        {
            if (obj == null)
            {
                return null;
            }

            return GetString(obj, "urlSlug", "urlslug", "slug");
        }

        private static string? FirstNonEmpty(params string?[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            return null;
        }

        private static bool IsPaintItem(JsonObject bookmark)
        {
            var type = NormalizeType(bookmark);
            return string.Equals(type, "paint", StringComparison.OrdinalIgnoreCase);
        }

        private static string? NormalizeType(JsonObject bookmark)
        {
            var raw = GetString(bookmark, "itemType", "type");
            if (string.IsNullOrWhiteSpace(raw))
            {
                return null;
            }

            raw = raw.Trim().ToLowerInvariant();

            if (raw == "1" || raw == "paint" || raw == "paints")
            {
                return "paint";
            }

            if (raw == "2" || raw == "article" || raw == "articles")
            {
                return "article";
            }

            return raw;
        }

        private static bool IsArticleItem(JsonObject bookmark)
        {
            var type = NormalizeType(bookmark);
            return string.Equals(type, "article", StringComparison.OrdinalIgnoreCase);
        }

        private static int? GetBookmarkItemId(JsonObject bookmark)
        {
            return GetInt(bookmark, "itemId", "id");
        }

        private static int? GetInt(JsonObject obj, params string[] propertyNames)
        {
            foreach (var property in propertyNames)
            {
                if (obj.TryGetPropertyValue(property, out var node) && node is JsonValue value)
                {
                    if (value.TryGetValue<int>(out var intValue))
                    {
                        return intValue;
                    }
                }
            }

            return null;
        }

        private static bool TryGetString(JsonObject obj, out string? result, params string[] propertyNames)
        {
            result = GetString(obj, propertyNames);
            return result != null;
        }

        private static string? GetString(JsonObject obj, params string[] propertyNames)
        {
            foreach (var property in propertyNames)
            {
                if (obj.TryGetPropertyValue(property, out var node) && node is JsonValue value)
                {
                    if (value.TryGetValue<string>(out var stringValue) && !string.IsNullOrWhiteSpace(stringValue))
                    {
                        return stringValue;
                    }

                    if (value.TryGetValue<int>(out var intValue))
                    {
                        return intValue.ToString();
                    }
                }
            }

            return null;
        }

        private static void ApplyValue(JsonObject target, string propertyName, string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            if (target.TryGetPropertyValue(propertyName, out var existing) && existing is JsonValue existingValue)
            {
                if (existingValue.TryGetValue<string>(out var existingString) && !string.IsNullOrWhiteSpace(existingString))
                {
                    return;
                }
            }

            target[propertyName] = value;
        }

        private static void MergeJsonObjects(JsonObject target, JsonObject source)
        {
            foreach (var kvp in source)
            {
                if (kvp.Key == null || target.ContainsKey(kvp.Key))
                {
                    continue;
                }

                target[kvp.Key] = CloneNode(kvp.Value);
            }
        }

        private static JsonObject? CloneJsonObject(JsonObject source)
        {
            return CloneNode(source) as JsonObject;
        }

        private static JsonNode? CloneNode(JsonNode? node)
        {
            if (node is null)
            {
                return null;
            }

            try
            {
                return JsonNode.Parse(node.ToJsonString());
            }
            catch
            {
                return null;
            }
        }

        private readonly record struct PaintBookmarkInfo(string? BrandSlug, string? SeriesSlug, string? PaintSlug, JsonObject? Paint)
        {
            public bool IsComplete => !string.IsNullOrWhiteSpace(BrandSlug)
                                       && !string.IsNullOrWhiteSpace(SeriesSlug)
                                       && !string.IsNullOrWhiteSpace(PaintSlug);
        }

        private readonly record struct ArticleBookmarkInfo(ArticleDto? Article, JsonObject? ArticleJson);

        private async Task<Dictionary<int, ArticleBookmarkInfo>> FetchArticleDataAsync(IEnumerable<int> articleIds)
        {
            var results = new Dictionary<int, ArticleBookmarkInfo>();

            var tasks = articleIds.Select(async id =>
            {
                try
                {
                    var payload = await _apiClient.GetArticleByIdAsync(id);
                    var article = JsonSerializer.Deserialize<ArticleDto>(payload, JsonOptions);
                    var articleJson = JsonNode.Parse(payload) as JsonObject;
                    return (id, info: new ArticleBookmarkInfo(article, articleJson));
                }
                catch
                {
                    return (id, info: (ArticleBookmarkInfo?)null);
                }
            });

            foreach (var task in tasks)
            {
                var (id, info) = await task;
                if (info.HasValue && info.Value.Article != null)
                {
                    results[id] = info.Value;
                }
            }

            return results;
        }

        private static string BuildArticleSlug(ArticleDto? article, int id)
        {
            if (article != null && !string.IsNullOrWhiteSpace(article.Slug))
            {
                return article.Slug;
            }

            var source = article?.Title ?? string.Empty;
            var slug = source.ToLowerInvariant();
            slug = slug.Normalize(System.Text.NormalizationForm.FormD);
            slug = System.Text.RegularExpressions.Regex.Replace(slug, "[^a-z0-9\\s-]", string.Empty);
            slug = System.Text.RegularExpressions.Regex.Replace(slug, "\\s+", "-");
            slug = System.Text.RegularExpressions.Regex.Replace(slug, "-+", "-").Trim('-');

            if (string.IsNullOrWhiteSpace(slug))
            {
                return $"article-{id}";
            }

            return slug;
        }
    }
}

