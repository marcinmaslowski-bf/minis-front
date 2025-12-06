using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class UpdateArticleRequest
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("contentType")]
        public ContentType ContentType { get; set; }

        [JsonPropertyName("titleImageAttachmentId")]
        public int TitleImageAttachmentId { get; set; }

        [JsonPropertyName("content")]
        public EditorJsDocumentDto? Content { get; set; }

        [JsonPropertyName("published")]
        public bool Published { get; set; }
    }
}
