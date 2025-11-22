using System.Threading.Tasks;

namespace PaintCatalog.Portal.Helpers
{
    public interface IAccessTokenProvider
    {
        Task<string?> GetAccessTokenAsync();
    }
}
