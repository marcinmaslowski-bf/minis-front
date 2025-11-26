using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using PaintCatalog.Portal.Models.Api;

namespace PaintCatalog.Portal.ApiClients
{
    public interface IPaintCatalogApiClient
    {
        // Paints
        Task<string> GetPaintsRawAsync(
            int? brandId = null,
            int? seriesId = null,
            int? type = null,
            int? finish = null,
            int? medium = null,
            IEnumerable<int>? tagIds = null,
            string? search = null,
            int? page = null,
            int? pageSize = null);

        Task<string> GetBrandsRawAsync();

        Task<string> GetBrandSeriesRawAsync(string brandSlug);

        Task<string> GetPaintBySlugsRawAsync(string brandSlug, string seriesSlug, string paintSlug);

        Task<string> GetCommentsByThreadIdAsync(int threadId);

        Task<string> GetCommentCountByThreadIdAsync(int threadId);

        Task<string> CreateCommentAsync(int threadId, CreateCommentRequest request);

        Task<string> UpdateCommentAsync(int threadId, int commentId, UpdateCommentRequest request);

        Task<string> GetVoteSummaryAsync(int threadId);

        Task<string> GetVoteSummariesAsync(IEnumerable<int> threadIds);

        Task<string> SetVoteAsync(int threadId, SetVoteRequest request);

        // Attachments
        Task<HttpResponseMessage> GetAttachmentAsync(int attachmentId);

        Task<int> UploadAttachmentAsync(IFormFile file);

        Task EnsureCurrentUserExistsAsync();

        // Tutorials
        Task<string> GetTutorialsRawAsync(string? authorId = null, int? page = null, int? pageSize = null);

        Task<string> GetTutorialByIdAsync(int tutorialId);

        Task<string> CreateTutorialAsync(CreateTutorialRequest request);

        Task<string> UpdateTutorialAsync(int tutorialId, UpdateTutorialRequest request);

        Task<string> DeleteTutorialAsync(int tutorialId);
    }
}
