using System.Collections.Generic;

namespace PaintCatalog.Portal.Models.Tutorials
{
    public class TutorialsIndexViewModel
    {
        public List<TutorialListItem> Tutorials { get; set; } = new();

        public string? RawJson { get; set; }
    }
}
