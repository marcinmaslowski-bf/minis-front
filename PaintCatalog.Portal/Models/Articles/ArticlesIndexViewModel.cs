using System.Collections.Generic;

namespace PaintCatalog.Portal.Models.Articles
{
    public class ArticlesIndexViewModel
    {
        public List<ArticleListItem> Articles { get; set; } = new();

        public string? RawJson { get; set; }
    }
}
