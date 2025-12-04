using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.Localization;
using PaintCatalog.Portal.Models.Api;

namespace PaintCatalog.Portal.Helpers
{
    public class PaintEnumLabels
    {
        public Dictionary<string, string> Types { get; init; } = new();
        public Dictionary<string, string> Sheens { get; init; } = new();
        public Dictionary<string, string> Mediums { get; init; } = new();
        public Dictionary<string, string> Effects { get; init; } = new();
        public Dictionary<string, string> Usages { get; init; } = new();
        public Dictionary<string, string> Forms { get; init; } = new();
        public Dictionary<string, string> Gradients { get; init; } = new();
    }

    public static class EnumLabelHelper
    {
        private static readonly GradientType[] GradientOrder =
        {
            GradientType.None,
            GradientType.Linear,
            GradientType.Radial
        };

        public static PaintEnumLabels CreatePaintEnumLabels(IHtmlLocalizer localizer)
        {
            return new PaintEnumLabels
            {
                Types = BuildDictionary<PaintType>(localizer, "Filters_Type"),
                Sheens = BuildDictionary<PaintSheen>(localizer, "Filters_Finish"),
                Mediums = BuildDictionary<PaintMedium>(localizer, "Filters_Medium"),
                Effects = BuildDictionary<PaintEffect>(localizer, "Filters_Effect"),
                Usages = BuildDictionary<PaintUsage>(localizer, "Filters_Usage"),
                Forms = BuildDictionary<PaintForm>(localizer, "Filters_Form"),
                Gradients = GradientOrder
                    .Select((value, index) => new KeyValuePair<string, string>(((int)value).ToString(), GetGradientLabel(index)))
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
            };
        }

        private static Dictionary<string, string> BuildDictionary<TEnum>(IHtmlLocalizer localizer, string labelPrefix)
            where TEnum : struct, Enum
        {
            var isFlagsEnum = typeof(TEnum).IsDefined(typeof(FlagsAttribute), inherit: false);

            var values = Enum.GetValues(typeof(TEnum)).Cast<Enum>()
                .Where(value => Convert.ToInt64(value) != 0)
                .Where(value => !isFlagsEnum || IsPowerOfTwo(Convert.ToInt64(value)))
                .OrderBy(value => Convert.ToInt64(value))
                .ToArray();

            return values
                .Select((value, index) => new KeyValuePair<string, string>(
                    Convert.ToInt64(value).ToString(),
                    localizer[$"{labelPrefix}_{index + 1}"].Value))
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        private static bool IsPowerOfTwo(long value)
        {
            return (value & (value - 1)) == 0;
        }

        private static string GetGradientLabel(int index)
        {
            return index switch
            {
                0 => "None",
                1 => "Linear",
                2 => "Radial",
                _ => string.Empty
            };
        }
    }
}
