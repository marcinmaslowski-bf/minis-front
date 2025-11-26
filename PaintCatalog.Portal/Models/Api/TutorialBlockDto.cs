using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class TutorialBlockDto
    {
        [JsonPropertyName("header")]
        public string? Header { get; set; }

        [JsonPropertyName("subHeaders")]
        public List<string>? SubHeaders { get; set; }

        [JsonPropertyName("paintIds")]
        public List<int>? PaintIds { get; set; }

        [JsonPropertyName("images")]
        public List<TutorialImageDto>? Images { get; set; }

        [JsonPropertyName("body")]
        public string? Body { get; set; }
    }
}
