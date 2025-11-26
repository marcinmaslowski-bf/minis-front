using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaintCatalog.Portal.ApiClients;
using PaintCatalog.Portal.Models.Api;

namespace PaintCatalog.Portal.Controllers
{
    [Route("votes")]
    public class VotesController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;

        public VotesController(IPaintCatalogApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> Summary([FromQuery] List<int> threadIds)
        {
            try
            {
                var payload = await _apiClient.GetVoteSummariesAsync(threadIds ?? new List<int>());
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(new { error = "Vote thread not found" });
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

        [HttpGet("{threadId}/summary")]
        public async Task<IActionResult> SummaryById(int threadId)
        {
            try
            {
                var payload = await _apiClient.GetVoteSummaryAsync(threadId);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(new { error = "Vote thread not found" });
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
        public async Task<IActionResult> Set(int threadId, [FromBody] SetVoteRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Vote value is required" });
            }

            try
            {
                var payload = await _apiClient.SetVoteAsync(threadId, request);
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(new { error = "Vote thread not found" });
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
