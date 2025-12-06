using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using PaintCatalog.Portal.Models.Api;

namespace PaintCatalog.Portal.ApiClients;

public interface IPaintCatalogApiClient
{
    // Paints
    Task<string> GetPaintsRawAsync(
        int? id = null,
        IEnumerable<int>? ids = null,
        int? brandId = null,
        int? seriesId = null,
        IEnumerable<int>? types = null,
        IEnumerable<int>? sheens = null,
        IEnumerable<int>? mediums = null,
        IEnumerable<int>? effects = null,
        IEnumerable<int>? usages = null,
        IEnumerable<int>? forms = null,
        IEnumerable<int>? tagIds = null,
        string? search = null,
        int? page = null,
        int? pageSize = null);

    Task<string> CreatePaintAsync(CreatePaintRequest request);

    Task<string> UpdatePaintAsync(int id, UpdatePaintRequest request);

    Task<string> DeletePaintAsync(int id);

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

    // Articles
    Task<string> GetArticlesRawAsync(string? authorId = null, int? page = null, int? pageSize = null);

    Task<string> GetArticleByIdAsync(int articleId);

    Task<string> CreateArticleAsync(CreateArticleRequest request);

    Task<string> UpdateArticleAsync(int articleId, UpdateArticleRequest request);

    Task<string> DeleteArticleAsync(int articleId);

    // Bookmarks
    Task<string> GetBookmarkAsync(BookmarkItemType itemType, int itemId);

    Task<string> UpsertBookmarkAsync(UpsertBookmarkRequest request);

    Task<string> DeleteBookmarkAsync(BookmarkItemType itemType, int itemId);

    Task<string> GetBookmarkCategoriesAsync(BookmarkItemType? itemType = null);

    Task<string> CreateBookmarkCategoryAsync(CreateBookmarkCategoryRequest request);

    Task<string> GetBookmarksAsync();
}
