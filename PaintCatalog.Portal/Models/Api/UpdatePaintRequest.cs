using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PaintCatalog.Portal.Models.Api
{
    public class UpdatePaintRequest
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("slug")]
        public string? Slug { get; set; }

        [JsonPropertyName("type")]
        public PaintType Type { get; set; }

        [JsonPropertyName("sheen")]
        public PaintSheen Sheen { get; set; }

        [JsonPropertyName("medium")]
        public PaintMedium Medium { get; set; }

        [JsonPropertyName("effects")]
        public PaintEffect Effects { get; set; }

        [JsonPropertyName("usage")]
        public PaintUsage Usage { get; set; }

        [JsonPropertyName("form")]
        public PaintForm Form { get; set; }

        [JsonPropertyName("gradientType")]
        public GradientType GradientType { get; set; }

        [JsonPropertyName("hexColor")]
        public string? HexColor { get; set; }

        [JsonPropertyName("hexFrom")]
        public string? HexFrom { get; set; }

        [JsonPropertyName("hexTo")]
        public string? HexTo { get; set; }

        [JsonPropertyName("isDiscontinued")]
        public bool IsDiscontinued { get; set; }

        [JsonPropertyName("tagIds")]
        public List<int>? TagIds { get; set; }
    }
}
