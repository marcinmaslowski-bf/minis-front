using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using PaintCatalog.Portal.Helpers;

namespace PaintCatalog.Portal.Routing
{
    /// <summary>
    /// Matches cultures defined in <see cref="CultureHelpers.SupportedCultures"/> except the default culture.
    /// Keeps culture prefixes aligned across the app without hardcoding them in each route.
    /// </summary>
    public sealed class SupportedCultureRouteConstraint : IRouteConstraint
    {
        public bool Match(HttpContext? httpContext, IRouter? route, string routeKey, RouteValueDictionary values, RouteDirection routeDirection)
        {
            if (!values.TryGetValue(routeKey, out var cultureValue))
            {
                return false;
            }

            var culture = Convert.ToString(cultureValue);

            if (CultureHelpers.IsDefaultCulture(culture))
            {
                return false;
            }

            return CultureHelpers.IsSupportedCulture(culture);
        }
    }
}
