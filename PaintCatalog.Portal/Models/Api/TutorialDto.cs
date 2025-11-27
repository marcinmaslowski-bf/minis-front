using System;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class TutorialDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("titleImageAttachmentId")]
        public int? TitleImageAttachmentId { get; set; }

        [JsonPropertyName("content")]
        public EditorJsDocumentDto? Content { get; set; }

        [JsonPropertyName("authorId")]
        public string? AuthorId { get; set; }

        [JsonPropertyName("published")]
        public bool Published { get; set; }

        [JsonPropertyName("createdAtUtc")]
        public DateTime? CreatedAtUtc { get; set; }

        [JsonPropertyName("updatedAtUtc")]
        public DateTime? UpdatedAtUtc { get; set; }
    }
}
