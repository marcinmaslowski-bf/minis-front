using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum PaintEffect
    {
        None = 0,
        Metallic = 1 << 0,
        Fluorescent = 1 << 1,
        Transparent = 1 << 2,
        Pearlescent = 1 << 3,
        ColorShift = 1 << 4
    }
}

