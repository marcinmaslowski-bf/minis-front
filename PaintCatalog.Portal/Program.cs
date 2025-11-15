using System.Globalization;
using System.Linq;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Localization.Routing;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.Extensions.Options;
using PaintCatalog.Portal.ApiClients;

var builder = WebApplication.CreateBuilder(args);

// Localization
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

builder.Services
    .AddControllersWithViews()
    .AddViewLocalization(LanguageViewLocationExpanderFormat.Suffix)
    .AddDataAnnotationsLocalization();

var supportedCultures = new[] { "en", "pl" };

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    options.DefaultRequestCulture = new RequestCulture("en");
    options.SupportedCultures = supportedCultures.Select(c => new CultureInfo(c)).ToList();
    options.SupportedUICultures = options.SupportedCultures;

    options.RequestCultureProviders = new[]
    {
        new RouteDataRequestCultureProvider
        {
            RouteDataStringKey = "culture",
            UIRouteDataStringKey = "culture"
        }
    };
});

// HttpClient for PaintCatalog.Api
builder.Services.AddHttpClient<IPaintCatalogApiClient, PaintCatalogApiClient>((sp, client) =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var baseUrl = configuration["PaintCatalogApi:BaseUrl"];
    if (string.IsNullOrWhiteSpace(baseUrl))
    {
        throw new InvalidOperationException("PaintCatalogApi:BaseUrl is not configured in appsettings.");
    }

    client.BaseAddress = new Uri(baseUrl);
});

var app = builder.Build();

// Enforce canonical URLs without trailing slash (except for root "/")
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;

    // Redirect to the lowercase version of the path if any uppercase letters are present.
    if (!string.IsNullOrEmpty(path) && path.Any(char.IsUpper))
    {
        var lowerCasePath = path.ToLowerInvariant();
        var query = context.Request.QueryString;
        context.Response.Redirect(lowerCasePath + query, permanent: true);
        return;
    }

    if (path.Length > 1 && path.EndsWith("/"))
    {
        var newPath = path.TrimEnd('/');
        var query = context.Request.QueryString;
        context.Response.Redirect(newPath + query, permanent: true);
        return;
    }

    await next();
});

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Localization must run after routing so RouteDataRequestCultureProvider can see route values
var locOptions = app.Services.GetRequiredService<IOptions<RequestLocalizationOptions>>();
app.UseRequestLocalization(locOptions.Value);

app.UseAuthorization();

// Routing: allow default routes without culture segment and an optional "pl" prefix
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}",
    defaults: new { culture = "en" });

app.MapControllerRoute(
    name: "localized",
    pattern: "{culture:regex(^pl$)}/{controller=Home}/{action=Index}/{id?}");

app.Run();
