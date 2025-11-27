using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class TutorialSectionItemDto
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("image")]
        public TutorialImageDto? Image { get; set; }

        [JsonPropertyName("stepNumber")]
        public int? StepNumber { get; set; }

        [JsonPropertyName("paintIds")]
        public List<int>? PaintIds { get; set; }
    }
}
