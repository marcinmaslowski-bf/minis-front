using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class UpdateTutorialRequest
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("titleImageAttachmentId")]
        public int TitleImageAttachmentId { get; set; }

        [JsonPropertyName("content")]
        public EditorJsDocumentDto? Content { get; set; }

        [JsonPropertyName("published")]
        public bool Published { get; set; }
    }
}
