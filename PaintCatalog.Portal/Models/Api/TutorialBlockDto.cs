using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class TutorialBlockDto
    {
        [JsonPropertyName("subtitle")]
        public string? Subtitle { get; set; }

        [JsonPropertyName("paintIds")]
        public List<int>? PaintIds { get; set; }

        [JsonPropertyName("image")]
        public TutorialImageDto? Image { get; set; }

        [JsonPropertyName("body")]
        public string? Body { get; set; }
    }
}
