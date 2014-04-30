
namespace IMX.MibServer2.MapEditor.Block.Models
{
    public class ElementType
    {
        public int Id { get; private set; }
        public string Title { get; private set; }
        public string ImageUrl { get; private set; }

        public ElementType(int id, string title, string clear_ImageUrl)
        {
            this.Id = id;
            this.Title = title;
            this.ImageUrl = clear_ImageUrl;
        }
    }
}