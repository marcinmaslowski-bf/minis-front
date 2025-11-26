using System;

namespace PaintCatalog.Portal.Models.Tutorials
{
    public class TutorialListItem
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public DateTime? CreatedAtUtc { get; set; }

        public DateTime? UpdatedAtUtc { get; set; }
    }
}
