using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using PaintCatalog.Portal.Models;

namespace PaintCatalog.Portal.Controllers
{
    public class ErrorsController : Controller
    {
        [Route("errors/{statusCode}")]
        [Route("{culture:regex(^pl$)}/errors/{statusCode}")]
        public IActionResult Status(int statusCode)
        {
            var reExecute = HttpContext.Features.Get<IStatusCodeReExecuteFeature>();

            var model = new ErrorStatusViewModel
            {
                StatusCode = statusCode,
                OriginalPath = reExecute?.OriginalPath
            };

            Response.StatusCode = statusCode;

            return View("Status", model);
        }
    }
}
