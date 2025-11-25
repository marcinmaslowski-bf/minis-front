using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PaintCatalog.Portal.ApiClients;

namespace PaintCatalog.Portal.Controllers
{
    [Route("attachments")]
    public class AttachmentsController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;

        public AttachmentsController(IPaintCatalogApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        [HttpGet("{attachmentId:int}")]
        public async Task<IActionResult> Get(int attachmentId)
        {
            try
            {
                using var response = await _apiClient.GetAttachmentAsync(attachmentId);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return NotFound();
                }

                if (response.StatusCode == HttpStatusCode.Unauthorized
                    || response.StatusCode == HttpStatusCode.Forbidden)
                {
                    return StatusCode((int)response.StatusCode);
                }

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)HttpStatusCode.ServiceUnavailable, new
                    {
                        error = "Paint catalog API unavailable"
                    });
                }

                var content = await response.Content.ReadAsByteArrayAsync();
                var contentType = response.Content.Headers.ContentType?.ToString()
                    ?? "application/octet-stream";

                var fileName = response.Content.Headers.ContentDisposition?.FileNameStar
                    ?? response.Content.Headers.ContentDisposition?.FileName;

                return File(content, contentType, fileName);
            }
            catch (HttpRequestException ex)
            {
                return StatusCode((int)HttpStatusCode.ServiceUnavailable, new
                {
                    error = "Paint catalog API unavailable",
                    detail = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, new
                {
                    error = "Unexpected server error",
                    detail = ex.Message
                });
            }
        }
    }
}
