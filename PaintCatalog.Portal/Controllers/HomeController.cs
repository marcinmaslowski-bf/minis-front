using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PaintCatalog.Portal.ApiClients;
using PaintCatalog.Portal.Models;

namespace PaintCatalog.Portal.Controllers
{
    public class HomeController : Controller
    {
        private readonly IPaintCatalogApiClient _apiClient;
        public HomeController(IPaintCatalogApiClient apiClient)
        {
            _apiClient = apiClient;
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

            return View(vm);
        }
    }
}
