namespace PaintCatalog.Portal.Models.Tutorials
{
    public class TutorialEditViewModel
    {
        public int? Id { get; set; }

        public string? Title { get; set; }

        public int? TitleImageAttachmentId { get; set; }

        public string? ContentJson { get; set; }

        public bool IsEdit => Id.HasValue;
    }
}
