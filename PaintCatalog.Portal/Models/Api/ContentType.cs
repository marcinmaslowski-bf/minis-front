using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum ContentType
    {
        Tutorial = 1,
        BattleReport = 2,
        Review = 4,
        Event = 8,
        News = 16
    }
}
