using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class BookmarkDto
    {
        [JsonPropertyName("categoryId")]
        public int CategoryId { get; set; }

        [JsonPropertyName("categoryName")]
        public string? CategoryName { get; set; }

        [JsonPropertyName("category")]
        public BookmarkCategoryDto? Category { get; set; }

        [JsonPropertyName("note")]
        public string? Note { get; set; }
    }
}

