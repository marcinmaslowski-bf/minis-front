using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.Rendering;
using PaintCatalog.Portal.Models.Api;

namespace PaintCatalog.Portal.Models.Articles
{
    public class ArticleEditViewModel
    {
        public int? Id { get; set; }

        public string? Title { get; set; }

        public List<int> SelectedContentTypes { get; set; } = new();

        public List<SelectListItem> ContentTypeOptions { get; set; } = new();

        public int? TitleImageAttachmentId { get; set; }

        public string? ContentJson { get; set; }

        public bool Published { get; set; }

        public bool IsEdit => Id.HasValue;
    }
}
