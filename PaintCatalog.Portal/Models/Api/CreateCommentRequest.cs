using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class CreateCommentRequest
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [JsonPropertyName("parentCommentId")]
        public int? ParentCommentId { get; set; }

        [JsonPropertyName("attachments")]
        public List<CreateCommentAttachmentRequest>? Attachments { get; set; }
    }

    public class CreateCommentAttachmentRequest
    {
        [JsonPropertyName("type")]
        public int? Type { get; set; }

        [JsonPropertyName("location")]
        public string? Location { get; set; }

        [JsonPropertyName("fileName")]
        public string? FileName { get; set; }

        [JsonPropertyName("contentType")]
        public string? ContentType { get; set; }
    }
}
