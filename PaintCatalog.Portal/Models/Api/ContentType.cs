using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum ContentType
    {
        Tutorial = 1 << 0,
        BattleReport = 1 << 1,
        Review = 1 << 2,
        Event = 1 << 3,
        News = 1 << 4
    }
}
