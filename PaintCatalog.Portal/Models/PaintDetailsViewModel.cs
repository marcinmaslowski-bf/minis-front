namespace PaintCatalog.Portal.Models
{
    public class PaintDetailsViewModel
    {
        public string BrandSlug { get; set; } = string.Empty;
        public string SeriesSlug { get; set; } = string.Empty;
        public string PaintSlug { get; set; } = string.Empty;
        public string? PaintJson { get; set; }
    }
}
