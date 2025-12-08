using System.Globalization;
using System.Linq;

namespace PaintCatalog.Portal.Helpers
{
    public static class CultureHelpers
    {
        public const string DefaultCulture = "en";

        public static readonly string[] SupportedCultures = { "en", "pl" };

        public static string GetCurrentLangTwoLetter()
            => CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;

        public static bool IsDefaultCulture(string? culture)
            => string.Equals(culture, DefaultCulture, StringComparison.OrdinalIgnoreCase);

        public static bool IsSupportedCulture(string? culture)
            => !string.IsNullOrWhiteSpace(culture)
               && SupportedCultures.Contains(culture, StringComparer.OrdinalIgnoreCase);

        public static bool IsPl()
            => string.Equals(GetCurrentLangTwoLetter(), "pl", StringComparison.OrdinalIgnoreCase);

        public static bool IsEn()
            => string.Equals(GetCurrentLangTwoLetter(), "en", StringComparison.OrdinalIgnoreCase);

        /// <summary>
        /// Returns route culture segment value used in URLs. Default culture ("en") yields null so
        /// URLs stay segment-free; other supported cultures return their two-letter code.
        /// </summary>
        public static string? GetRouteCultureSegment()
        {
            var current = GetCurrentLangTwoLetter();

            if (!IsSupportedCulture(current) || IsDefaultCulture(current))
            {
                return null;
            }

            return current;
        }
    }
}
