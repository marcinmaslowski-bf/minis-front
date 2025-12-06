using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class EditorJsDocumentDto
    {
        [JsonPropertyName("sections")]
        public List<ArticleSectionDto>? Sections { get; set; }

        [JsonPropertyName("time")]
        public long? Time { get; set; }

        [JsonPropertyName("version")]
        public string? Version { get; set; }
    }
}
