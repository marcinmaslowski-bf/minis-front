using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class UpsertBookmarkRequest
    {
        [JsonPropertyName("itemType")]
        public BookmarkItemType ItemType { get; set; }

        [JsonPropertyName("itemId")]
        public int ItemId { get; set; }

        [JsonPropertyName("categoryId")]
        public int CategoryId { get; set; }

        [JsonPropertyName("note")]
        public string? Note { get; set; }
    }
}

