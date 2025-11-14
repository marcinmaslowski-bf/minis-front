using System.Collections.Generic;

namespace PaintCatalog.Portal.Models.Api
{
    public class UpdatePaintRequest
    {
        public string? Name { get; set; }
        public string? Slug { get; set; }
        public string? Code { get; set; }
        public PaintType Type { get; set; }
        public PaintFinish Finish { get; set; }
        public PaintMedium Medium { get; set; }
        public string? HexColor { get; set; }
        public string? HexFrom { get; set; }
        public string? HexTo { get; set; }
        public double? Opacity { get; set; }
        public double? BottleMl { get; set; }
        public bool IsDiscontinued { get; set; }
        public List<int>? TagIds { get; set; }
    }
}
