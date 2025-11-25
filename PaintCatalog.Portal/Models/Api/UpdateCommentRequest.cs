using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class UpdateCommentRequest
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }
}
