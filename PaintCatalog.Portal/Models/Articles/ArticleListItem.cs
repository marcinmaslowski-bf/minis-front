using System;

namespace PaintCatalog.Portal.Models.Articles
{
    public class ArticleListItem
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public bool Published { get; set; }

        public DateTime? CreatedAtUtc { get; set; }

        public DateTime? UpdatedAtUtc { get; set; }
    }
}
