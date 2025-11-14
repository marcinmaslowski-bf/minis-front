using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using PaintCatalog.Portal;
using PaintCatalog.Portal.ApiClients;
using PaintCatalog.Portal.Models;

namespace PaintCatalog.Portal.Controllers
{
    public class HomeController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public HomeController(IPaintCatalogApiClient apiClient, IStringLocalizer<SharedResource> localizer)
        {
            _apiClient = apiClient;
            _localizer = localizer;
        }

        public async Task<IActionResult> Index()
        {
            string? paintsJson = null;

            try
            {
                // Small sample to verify that integration with PaintCatalog.Api works.
                paintsJson = await _apiClient.GetBrandsRawAsync();
            }
            catch
            {
                // API may not be available/configured yet - fail silently for demo.
            }

            var vm = new HomeViewModel
            {
                PaintsJsonSample = paintsJson
            };

            ViewData["Title"] = _localizer["SiteTitle"];

            return View(vm);
        }
    }
}
