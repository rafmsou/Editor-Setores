using IMX.Model;

namespace IMX.MibServer2.MapEditor.Block.Models
{
    public class MapEditorModel
    {
        public ImxMapMetadata mapMetadata { get; set; }
        public ImxMapPosition[] positions { get; set; }
    }
}