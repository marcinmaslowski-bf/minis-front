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
    [Route("comments")]
    public class CommentsController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;

        public CommentsController(IPaintCatalogApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        [HttpGet("{threadId}")]
        public async Task<IActionResult> Thread(int threadId)
        {
            try
            {
                var payload = await _apiClient.GetCommentsByThreadIdAsync(threadId);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(new { error = "Comment thread not found" });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode((int)HttpStatusCode.ServiceUnavailable, new { error = "Paint catalog API unavailable", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Unexpected server error", detail = ex.Message });
            }
        }

        [HttpGet("{threadId}/count")]
        public async Task<IActionResult> Count(int threadId)
        {
            try
            {
                var payload = await _apiClient.GetCommentCountByThreadIdAsync(threadId);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(new { error = "Comment thread not found" });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode((int)HttpStatusCode.ServiceUnavailable, new { error = "Paint catalog API unavailable", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Unexpected server error", detail = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("{threadId}")]
        public async Task<IActionResult> Create(int threadId, [FromBody] CreateCommentRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { error = "Comment content is required" });
            }

            try
            {
                var payload = await _apiClient.CreateCommentAsync(threadId, request);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(new { error = "Comment thread not found" });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode((int)HttpStatusCode.ServiceUnavailable, new { error = "Paint catalog API unavailable", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Unexpected server error", detail = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("{threadId}/{commentId}")]
        public async Task<IActionResult> Update(int threadId, int commentId, [FromBody] UpdateCommentRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { error = "Comment content is required" });
            }

            try
            {
                var payload = await _apiClient.UpdateCommentAsync(threadId, commentId, request);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(new { error = "Comment not found" });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode((int)HttpStatusCode.ServiceUnavailable, new { error = "Paint catalog API unavailable", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new { error = "Unexpected server error", detail = ex.Message });
            }
        }
    }
}
