namespace PaintCatalog.Portal.Models.Bookmarks
{
    public class BookmarkTabsViewModel
    {
        public string? BookmarksEndpoint { get; set; }

        public string? Prefix { get; set; } = "bookmark";

        public string Variant { get; set; } = "bookmarks";

        public bool ShowRefreshButton { get; set; } = true;
    }
}
