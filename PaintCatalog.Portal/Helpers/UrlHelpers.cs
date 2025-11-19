using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace PaintCatalog.Portal.Helpers
{
    public static class UrlHelperExtensions
    {
        public static string LocalizedAction(this IUrlHelper url, string action, string controller)
        {
            var cultureSegment = CultureHelpers.GetRouteCultureSegment();
            if(cultureSegment == null)
                return url.Action(action, controller) ?? "/";

            return url.Action(action, controller, new { culture = cultureSegment }) ?? "/";
        }
    }
}
