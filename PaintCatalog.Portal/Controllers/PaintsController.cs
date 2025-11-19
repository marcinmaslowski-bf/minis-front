using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PaintCatalog.Portal.ApiClients;
using PaintCatalog.Portal.Models;

namespace PaintCatalog.Portal.Controllers
{
    public class PaintsController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;

        public PaintsController(IPaintCatalogApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            string? paintsJson = null;
            string? brandsJson = null;

            try
            {
                paintsJson = await _apiClient.GetPaintsRawAsync(pageSize: 24);
            }
            catch
            {
                // The API may not be configured yet - fail gracefully.
            }

            try
            {
                brandsJson = await _apiClient.GetBrandsRawAsync();
            }
            catch
            {
                // Ignore missing brand data as well.
            }

            var vm = new PaintsViewModelvv
            {
                InitialPaintsJson = paintsJson,
                BrandsJson = brandsJson
            };

            return View(vm);
        }

        [HttpGet]
        public async Task<IActionResult> Data(
            int? brandId,
            int? seriesId,
            int? type,
            int? finish,
            int? medium,
            [FromQuery(Name = "tagIds")] List<int>? tagIds,
            string? search,
            int? page,
            int? pageSize)
        {
            try
            {
                var payload = await _apiClient.GetPaintsRawAsync(
                    brandId,
                    seriesId,
                    type,
                    finish,
                    medium,
                    tagIds,
                    search,
                    page,
                    pageSize);

                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(503, new { error = "Paint catalog API unavailable", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unexpected server error", detail = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Brands()
        {
            try
            {
                var payload = await _apiClient.GetBrandsRawAsync();
                return Content(payload, "application/json");
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(503, new { error = "Paint catalog API unavailable", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unexpected server error", detail = ex.Message });
            }
        }
    }
}
