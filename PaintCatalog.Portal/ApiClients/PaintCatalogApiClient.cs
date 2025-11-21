using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace PaintCatalog.Portal.ApiClients
{
    public class PaintCatalogApiClient : IPaintCatalogApiClient
    {
        private readonly HttpClient _httpClient;

        public PaintCatalogApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> GetPaintsRawAsync(
            int? brandId = null,
            int? seriesId = null,
            int? type = null,
            int? finish = null,
            int? medium = null,
            IEnumerable<int>? tagIds = null,
            string? search = null,
            int? page = null,
            int? pageSize = null)
        {
            var queryParts = new List<string>();

            if (brandId.HasValue) queryParts.Add($"brandId={brandId.Value}");
            if (seriesId.HasValue) queryParts.Add($"seriesId={seriesId.Value}");
            if (type.HasValue) queryParts.Add($"type={type.Value}");
            if (finish.HasValue) queryParts.Add($"finish={finish.Value}");
            if (medium.HasValue) queryParts.Add($"medium={medium.Value}");

            if (tagIds != null)
            {
                foreach (var id in tagIds)
                {
                    queryParts.Add($"tagIds={id}");
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                queryParts.Add($"search={Uri.EscapeDataString(search)}");
            }

            if (page.HasValue) queryParts.Add($"page={page.Value}");
            if (pageSize.HasValue) queryParts.Add($"pageSize={pageSize.Value}");

            var url = "/api/v1/paints";
            if (queryParts.Count > 0)
            {
                url += "?" + string.Join("&", queryParts);
            }

            using var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetBrandsRawAsync()
        {
            const string url = "/api/v1/brands";

            using var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetBrandSeriesRawAsync(string brandSlug)
        {
            if (string.IsNullOrWhiteSpace(brandSlug))
            {
                throw new ArgumentException("Brand slug must be provided", nameof(brandSlug));
            }

            var url = $"/api/v1/brands/{Uri.EscapeDataString(brandSlug)}/series";

            using var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetPaintBySlugsRawAsync(string brandSlug, string seriesSlug, string paintSlug)
        {
            if (string.IsNullOrWhiteSpace(brandSlug))
            {
                throw new ArgumentException("Brand slug must be provided", nameof(brandSlug));
            }

            if (string.IsNullOrWhiteSpace(seriesSlug))
            {
                throw new ArgumentException("Series slug must be provided", nameof(seriesSlug));
            }

            if (string.IsNullOrWhiteSpace(paintSlug))
            {
                throw new ArgumentException("Paint slug must be provided", nameof(paintSlug));
            }

            var url = $"/api/v1/paints/{Uri.EscapeDataString(brandSlug)}/{Uri.EscapeDataString(seriesSlug)}/{Uri.EscapeDataString(paintSlug)}";

            using var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }
    }
}
