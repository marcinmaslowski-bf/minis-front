using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class ArticleBlockDto
    {
        [JsonPropertyName("header")]
        public string? Header { get; set; }

        [JsonPropertyName("subHeaders")]
        public List<string>? SubHeaders { get; set; }

        [JsonPropertyName("paintIds")]
        public List<int>? PaintIds { get; set; }

        [JsonPropertyName("images")]
        public List<ArticleImageDto>? Images { get; set; }

        [JsonPropertyName("body")]
        public string? Body { get; set; }
    }
}
