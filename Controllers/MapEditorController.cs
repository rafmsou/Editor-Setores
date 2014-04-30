using System.Collections.Generic;
using System.Web.Mvc;
using IMX.API.Client.Services;
using IMX.MibServer2.MapEditor.Block.Models;
using IMX.Model;
using IMX.Model.Enum;
using MibClient2.Config;
using MibClient2.Web.Mvc;

namespace IMX.MibServer2.MapEditor.Block.Controllers
{
    [HandleError]
    public class MapEditorController : MibController
    {
        MibConfig apiConfig;
        public MapEditorController()
        {
            apiConfig = new MibConfig("ImxApiConfig.mibconfig");
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult GetImageUrl(int imageId)
        {
            var mediaClient = new MediaClient(apiConfig.GetString("ImxApiMediaUrl"), apiConfig.GetString("oAuthConsumerKey"), apiConfig.GetString("oAuthConsumerSecret"), 1);
            var url = mediaClient.GetUrl(imageId, "IMAGES");
            return Json(url, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetMatrixPositions(int sectorId, string minimumRow, string maximumRow,
            int minimumColumn, int maximumColumn, bool ascendingRow, bool ascendingColumn, MapRowSequenceType rowSequenceType)
        {
            var reservationClient = new ReservationClient(apiConfig.GetString("ImxApiMediaUrl"), apiConfig.GetString("oAuthConsumerKey"), apiConfig.GetString("oAuthConsumerSecret"), 1);

            var positions = reservationClient.GetPositionsByLocation(sectorId,
                minimumRow, maximumRow, minimumColumn, maximumColumn, ascendingRow, ascendingColumn, rowSequenceType);

            return Json(positions, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetPositions(int sectorIdTo, string listPositions)
        {
            var list = MibClient2.Tools.MibJson.FromJsonString<List<int>>(listPositions);
            var reservationClient = new ReservationClient(apiConfig.GetString("ImxApiMediaUrl"), apiConfig.GetString("oAuthConsumerKey"), apiConfig.GetString("oAuthConsumerSecret"), 1);
            var positions = reservationClient.GetPositions(sectorIdTo, list); ;
            return Json(positions, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetMapById(int mapIdFrom)
        {
            var mapClient = new MapClient(apiConfig.GetString("ImxApiMediaUrl"), apiConfig.GetString("oAuthConsumerKey"), apiConfig.GetString("oAuthConsumerSecret"), 1);
            ImxMap mapInfo = mapClient.GetMap(mapIdFrom);
            return Json(mapInfo, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetElementTypes()
        {
            var mapClient = new MapClient(apiConfig.GetString("ImxApiMediaUrl"), apiConfig.GetString("oAuthConsumerKey"), apiConfig.GetString("oAuthConsumerSecret"), 1);

            var apiElementTypes = mapClient.GetMapElementTypes();
            var elementTypes = new List<ElementType>();

            foreach (var element in apiElementTypes)
            {
                elementTypes.Add(new ElementType(element.ID, element.Name, element.Clear_ImageUrl));
            }

            return Json(elementTypes, JsonRequestBehavior.AllowGet);
        }
    }
}
