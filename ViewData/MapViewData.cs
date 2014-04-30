using System.Collections.Generic;
using MibClient2.Objects;
using IMX.Model;

namespace IMX.MibServer2.MapEditor.Block.ViewData
{
    public class MapViewData
    {
        public MibObject Object { get; set; }
        public string BarColor { get; set; }
        public bool Hidebar { get; set; }
        public string BlockName { get; set; }
        public string CustomParameter { get; set; }
        public bool IsEnabled { get; set; }
        public ImxMap MapInfo { get; set; }
    }
}