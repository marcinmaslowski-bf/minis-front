using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Http;

namespace PaintCatalog.Portal.Helpers
{
    public class AccessTokenProvider : IAccessTokenProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AccessTokenProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string?> GetAccessTokenAsync()
        {
            var httpContext = _httpContextAccessor.HttpContext;

            if (httpContext == null)
            {
                return null;
            }

            var accessToken = GetAccessTokenFromRequest(httpContext) ?? await GetAccessTokenFromAuthenticationAsync(httpContext);

            return accessToken;
        }

        private static async Task<string?> GetAccessTokenFromAuthenticationAsync(HttpContext httpContext)
        {
            if (httpContext.User?.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            var schemesToCheck = new[]
            {
                (string?)null,
                CookieAuthenticationDefaults.AuthenticationScheme,
                OpenIdConnectDefaults.AuthenticationScheme
            };

            foreach (var scheme in schemesToCheck)
            {
                var token = await httpContext.GetTokenAsync(scheme, "access_token");
                if (!string.IsNullOrWhiteSpace(token))
                {
                    return token;
                }
            }

            return null;
        }

        private static string? GetAccessTokenFromRequest(HttpContext httpContext)
        {
            if (!httpContext.Request.Headers.TryGetValue("Authorization", out var authorizationHeader))
            {
                return null;
            }

            if (!System.Net.Http.Headers.AuthenticationHeaderValue.TryParse(authorizationHeader, out var headerValue))
            {
                return null;
            }

            return string.Equals(headerValue.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
                ? headerValue.Parameter
                : null;
        }
    }
}
