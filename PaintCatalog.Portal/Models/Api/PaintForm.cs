using System;

namespace PaintCatalog.Portal.Models.Api
{
    [Flags]
    public enum PaintForm
    {
        Unknown = 0,
        Pot = 1 << 0,
        DropperBottle = 1 << 1,
        SprayCan = 1 << 2,
        AirbrushReady = 1 << 3,
        Marker = 1 << 4
    }
}

