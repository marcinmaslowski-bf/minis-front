using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using PaintCatalog.Portal.Helpers;
using PaintCatalog.Portal.Models.Api;

namespace PaintCatalog.Portal.ApiClients
{
    public class PaintCatalogApiClient : IPaintCatalogApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly IAccessTokenProvider _accessTokenProvider;

        public PaintCatalogApiClient(HttpClient httpClient, IAccessTokenProvider accessTokenProvider)
        {
            _httpClient = httpClient;
            _accessTokenProvider = accessTokenProvider;
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

            using var response = await SendGetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetBrandsRawAsync()
        {
            const string url = "/api/v1/brands";

            using var response = await SendGetAsync(url);
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

            using var response = await SendGetAsync(url);
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

            using var response = await SendGetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetCommentsByThreadIdAsync(int threadId)
        {
            var url = $"/api/v1/comment-threads/{threadId}/comments";

            using var response = await SendGetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetCommentCountByThreadIdAsync(int threadId)
        {
            var url = $"/api/v1/comment-threads/{threadId}/comments/count";

            using var response = await SendGetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> CreateCommentAsync(int threadId, CreateCommentRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var url = $"/api/v1/comment-threads/{threadId}/comments";
            var payload = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            using var response = await SendAsync(HttpMethod.Post, url, payload);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> UpdateCommentAsync(int threadId, int commentId, UpdateCommentRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var url = $"/api/v1/comment-threads/{threadId}/comments/{commentId}";
            var payload = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            using var response = await SendAsync(HttpMethod.Put, url, payload);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetVoteSummaryAsync(int threadId)
        {
            var url = $"/api/v1/vote-threads/{threadId}/summary";

            using var response = await SendGetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetVoteSummariesAsync(IEnumerable<int> threadIds)
        {
            if (threadIds == null)
            {
                throw new ArgumentNullException(nameof(threadIds));
            }

            var queryParts = new List<string>();
            foreach (var id in threadIds)
            {
                if (id <= 0) continue;
                queryParts.Add($"threadIds={id}");
            }

            var url = "/api/v1/vote-threads/summary";
            if (queryParts.Count > 0)
            {
                url += "?" + string.Join("&", queryParts);
            }

            using var response = await SendGetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> SetVoteAsync(int threadId, SetVoteRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var url = $"/api/v1/vote-threads/{threadId}/votes";
            var payload = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            using var response = await SendAsync(HttpMethod.Post, url, payload);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<HttpResponseMessage> GetAttachmentAsync(int attachmentId)
        {
            var url = $"/api/v1/attachments/{attachmentId}";

            return await SendGetAsync(url);
        }

        public async Task<int> UploadAttachmentAsync(IFormFile file)
        {
            if (file == null)
            {
                throw new ArgumentNullException(nameof(file));
            }

            using var content = new MultipartFormDataContent();
            var streamContent = new StreamContent(file.OpenReadStream());
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
            content.Add(streamContent, "file", file.FileName);

            using var response = await SendAsync(HttpMethod.Post, "/api/v1/attachments", content);
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(payload);

            if (TryExtractAttachmentId(document.RootElement, out var id))
            {
                return id;
            }

            throw new InvalidOperationException("Attachment upload succeeded but response did not include an ID.");
        }

        private static bool TryExtractAttachmentId(JsonElement element, out int id)
        {
            static bool TryGetInt(JsonElement source, string propertyName, out int parsed)
            {
                parsed = default;
                if (!source.TryGetProperty(propertyName, out var property))
                {
                    return false;
                }

                return TryParseInt(property, out parsed);
            }

            id = default;

            if (TryParseInt(element, out id))
            {
                return true;
            }

            if (element.ValueKind == JsonValueKind.Object)
            {
                if (TryGetInt(element, "id", out id)
                    || TryGetInt(element, "attachmentId", out id)
                    || TryGetInt(element, "attachment_id", out id))
                {
                    return true;
                }

                if (element.TryGetProperty("data", out var dataElement)
                    && dataElement.ValueKind == JsonValueKind.Object)
                {
                    return TryGetInt(dataElement, "id", out id)
                        || TryGetInt(dataElement, "attachmentId", out id)
                        || TryGetInt(dataElement, "attachment_id", out id);
                }
            }

            return false;
        }

        private static bool TryParseInt(JsonElement element, out int value)
        {
            value = default;

            switch (element.ValueKind)
            {
                case JsonValueKind.Number:
                    return element.TryGetInt32(out value);
                case JsonValueKind.String:
                    var raw = element.GetString();
                    return int.TryParse(raw, out value);
                default:
                    return false;
            }
        }

        public async Task EnsureCurrentUserExistsAsync()
        {
            const string url = "/api/v1/users/me";

            using var response = await SendAsync(HttpMethod.Post, url);
            response.EnsureSuccessStatusCode();
        }

        public async Task<string> GetTutorialsRawAsync(string? authorId = null, int? page = null, int? pageSize = null)
        {
            var queryParts = new List<string>();

            if (!string.IsNullOrWhiteSpace(authorId))
            {
                queryParts.Add($"AuthorId={Uri.EscapeDataString(authorId)}");
            }

            if (page.HasValue)
            {
                queryParts.Add($"Page={page.Value}");
            }

            if (pageSize.HasValue)
            {
                queryParts.Add($"PageSize={pageSize.Value}");
            }

            var url = "/api/v1/tutorials";

            if (queryParts.Count > 0)
            {
                url += "?" + string.Join("&", queryParts);
            }

            using var response = await SendGetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetTutorialByIdAsync(int tutorialId)
        {
            var url = $"/api/v1/tutorials/{tutorialId}";

            using var response = await SendGetAsync(url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> CreateTutorialAsync(CreateTutorialRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            const string url = "/api/v1/tutorials";
            var payload = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            using var response = await SendAsync(HttpMethod.Post, url, payload);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> UpdateTutorialAsync(int tutorialId, UpdateTutorialRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var url = $"/api/v1/tutorials/{tutorialId}";
            var payload = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            using var response = await SendAsync(HttpMethod.Put, url, payload);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> DeleteTutorialAsync(int tutorialId)
        {
            var url = $"/api/v1/tutorials/{tutorialId}";

            using var response = await SendAsync(HttpMethod.Delete, url);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        private async Task<HttpResponseMessage> SendGetAsync(string url)
        {
            return await SendAsync(HttpMethod.Get, url);
        }

        private async Task<HttpResponseMessage> SendAsync(HttpMethod method, string url, HttpContent? content = null)
        {
            var request = new HttpRequestMessage(method, url);

            if (content != null)
            {
                request.Content = content;
            }

            var accessToken = await _accessTokenProvider.GetAccessTokenAsync();
            if (!string.IsNullOrWhiteSpace(accessToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            }

            return await _httpClient.SendAsync(request);
        }
    }
}
