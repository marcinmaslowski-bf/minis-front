using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class ArticleSectionItemDto
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("caption")]
        public string? Caption { get; set; }

        [JsonPropertyName("alt")]
        public string? Alt { get; set; }

        [JsonPropertyName("attachmentId")]
        public int? AttachmentId { get; set; }

        [JsonPropertyName("paintIds")]
        public List<int>? PaintIds { get; set; }

        [JsonPropertyName("steps")]
        public List<ArticleStepDto>? Steps { get; set; }
    }
}
