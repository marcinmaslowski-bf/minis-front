using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class TutorialImageDto
    {
        [JsonPropertyName("attachmentId")]
        public int AttachmentId { get; set; }

        [JsonPropertyName("caption")]
        public string? Caption { get; set; }

        [JsonPropertyName("alt")]
        public string? Alt { get; set; }
    }
}
