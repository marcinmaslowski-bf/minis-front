using System.Globalization;
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

// Localization
var locOptions = app.Services.GetRequiredService<IOptions<RequestLocalizationOptions>>();
app.UseRequestLocalization(locOptions.Value);

// Enforce canonical URLs without trailing slash (except for root "/")
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;

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

app.UseAuthorization();

// Routing with optional culture segment: "" => en, "pl" => pl
app.MapControllerRoute(
    name: "default",
    pattern: "{culture:regex(^pl$)?}/{controller=Home}/{action=Index}/{id?}");

app.Run();
