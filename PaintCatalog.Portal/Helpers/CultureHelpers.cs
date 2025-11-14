using System.Globalization;

namespace PaintCatalog.Portal.Helpers
{
    public static class CultureHelpers
    {
        public static string GetCurrentLangTwoLetter()
            => CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;

        public static bool IsPl()
            => GetCurrentLangTwoLetter() == "pl";

        public static bool IsEn()
            => GetCurrentLangTwoLetter() == "en";

        /// <summary>
        /// Returns route culture segment value used in URLs.
        /// For now: null for EN (no segment), "pl" for Polish.
        /// </summary>
        public static string? GetRouteCultureSegment()
            => IsPl() ? "pl" : null;
    }
}
