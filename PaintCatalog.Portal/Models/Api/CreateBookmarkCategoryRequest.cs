using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class CreateBookmarkCategoryRequest
    {
        [JsonPropertyName("itemType")]
        public BookmarkItemType? ItemType { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}

