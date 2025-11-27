using System;
using PaintCatalog.Portal.Models.Api;

namespace PaintCatalog.Portal.Models.Tutorials
{
    public class TutorialDetailsViewModel
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public int? TitleImageAttachmentId { get; set; }

        public EditorJsDocumentDto Content { get; set; } = new EditorJsDocumentDto();

        public string ContentJson { get; set; } = string.Empty;

        public bool Published { get; set; }

        public DateTime? CreatedAtUtc { get; set; }

        public DateTime? UpdatedAtUtc { get; set; }

        public BookmarkDto? Bookmark { get; set; }
    }
}
