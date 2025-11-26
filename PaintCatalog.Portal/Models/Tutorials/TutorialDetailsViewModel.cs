using System;

namespace PaintCatalog.Portal.Models.Tutorials
{
    public class TutorialDetailsViewModel
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public int? TitleImageAttachmentId { get; set; }

        public string ContentJson { get; set; } = string.Empty;

        public DateTime? CreatedAtUtc { get; set; }

        public DateTime? UpdatedAtUtc { get; set; }
    }
}
