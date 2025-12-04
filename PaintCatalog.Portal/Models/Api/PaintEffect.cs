using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum PaintEffect
    {
        Unknown = 0,
        None = 1 << 0,
        Metallic = 1 << 1, // 2
        Fluorescent = 1 << 2, // 4
        Transparent = 1 << 3, // 8
        Pearlescent = 1 << 4, // 16
        ColorShift = 1 << 5  // 32
    }
}

