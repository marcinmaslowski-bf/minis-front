using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class TutorialSectionDto
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("blocks")]
        public List<TutorialBlockDto>? Blocks { get; set; }
    }
}
