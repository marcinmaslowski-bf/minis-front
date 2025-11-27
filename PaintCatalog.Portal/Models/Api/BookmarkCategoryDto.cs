using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class BookmarkCategoryDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("itemType")]
        public BookmarkItemType ItemType { get; set; }

        [JsonPropertyName("isDefault")]
        public bool? IsDefault { get; set; }
    }
}

