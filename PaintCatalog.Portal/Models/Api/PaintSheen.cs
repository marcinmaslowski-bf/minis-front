using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum PaintSheen
    {
        Unknown = 0,
        Matte = 1 << 0,
        Satin = 1 << 1,
        Gloss = 1 << 2
    }
}

