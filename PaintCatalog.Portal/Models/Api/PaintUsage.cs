using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum PaintUsage
    {
        None = 0,
        Brush = 1 << 0,
        Airbrush = 1 << 1,
        Spray = 1 << 2
    }
}

