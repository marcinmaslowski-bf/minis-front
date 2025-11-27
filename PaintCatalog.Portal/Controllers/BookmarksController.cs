using System;
using System.Net;
using System.Net.Http;
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
                return Content(payload, "application/json");
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
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Failed to remove bookmark", detail = ex.Message });
            }
        }
    }
}

