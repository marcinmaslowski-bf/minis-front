using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;
using PaintCatalog.Portal.Helpers;

namespace PaintCatalog.Portal.Controllers
{
    public class AccountController : Controller
    {
        [HttpGet("/login")]
        public IActionResult Login(string? returnUrl)
        {
            var redirectUrl = string.IsNullOrWhiteSpace(returnUrl)
                ? Url.LocalizedAction("Index", "Home") ?? "/"
                : returnUrl;

            return Challenge(new AuthenticationProperties { RedirectUri = redirectUrl }, OpenIdConnectDefaults.AuthenticationScheme);
        }

        [ValidateAntiForgeryToken]
        [HttpPost("/logout")]
        public IActionResult Logout()
        {
            var redirectUrl = Url.LocalizedAction("Index", "Home") ?? "/";

            return SignOut(new AuthenticationProperties { RedirectUri = redirectUrl },
                CookieAuthenticationDefaults.AuthenticationScheme,
                OpenIdConnectDefaults.AuthenticationScheme);
        }
    }
}
