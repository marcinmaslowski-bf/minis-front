using System.Collections.Generic;
using System.Threading.Tasks;

namespace PaintCatalog.Portal.ApiClients
{
    public interface IPaintCatalogApiClient
    {
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
    }
}
