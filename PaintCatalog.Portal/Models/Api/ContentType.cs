using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum ContentType
    {
        Tutorial = 1,
        Reference = 2,
        Review = 4,
        Showcase = 8,
        News = 16
    }
}
