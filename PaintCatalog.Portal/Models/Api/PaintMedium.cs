using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum PaintMedium
    {
        Unknown = 0,
        Acrylic = 1 << 0,
        Enamel = 1 << 1,
        Oil = 1 << 2,
        Lacquer = 1 << 3,
        Alcohol = 1 << 4
    }
}
