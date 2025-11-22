using System;
using System.Collections.Generic;
using System.Net;
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

            var vm = new PaintsViewModel
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

        [HttpGet]
        public async Task<IActionResult> Series(string brandSlug)
        {
            if (string.IsNullOrWhiteSpace(brandSlug))
            {
                return BadRequest(new { error = "Brand slug is required" });
            }

            try
            {
                var payload = await _apiClient.GetBrandSeriesRawAsync(brandSlug);
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

        [HttpGet("paints/{brandSlug}/{seriesSlug}/{paintSlug}", Name = "PaintDetails")]
        [HttpGet("{culture:regex(^pl$)}/paints/{brandSlug}/{seriesSlug}/{paintSlug}", Name = "PaintDetailsLocalized")]
        public async Task<IActionResult> Details(string brandSlug, string seriesSlug, string paintSlug)
        {
            try
            {
                var paintJson = await _apiClient.GetPaintBySlugsRawAsync(brandSlug, seriesSlug, paintSlug);

                var vm = new PaintDetailsViewModel
                {
                    BrandSlug = brandSlug,
                    SeriesSlug = seriesSlug,
                    PaintSlug = paintSlug,
                    PaintJson = paintJson
                };

                return View(vm);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                return StatusCode((int)HttpStatusCode.Unauthorized);
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
