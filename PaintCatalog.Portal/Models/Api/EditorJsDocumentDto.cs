using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class EditorJsDocumentDto
    {
        [JsonPropertyName("blocks")]
        public List<TutorialBlockDto>? Blocks { get; set; }

        [JsonPropertyName("time")]
        public long? Time { get; set; }

        [JsonPropertyName("version")]
        public string? Version { get; set; }
    }
}
