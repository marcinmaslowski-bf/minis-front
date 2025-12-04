using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum PaintType
    {
        Unknown = 0,
        Base = 1 << 0,
        Layer = 1 << 1,
        Contrast = 1 << 2,
        Shade = 1 << 3,
        Dry = 1 << 4,
        Technical = 1 << 5,
        Air = 1 << 6,
        Primer = 1 << 7,
        Varnish = 1 << 8,
        Medium = 1 << 9
    }
}
