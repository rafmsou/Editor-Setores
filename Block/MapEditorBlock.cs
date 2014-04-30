using System;
using System.Collections.Generic;
using System.Web;
using IMX.MibServer2.MapEditor.Block.ViewData;
using MibClient2.Objects;
using MibClient2.Tools;
using MibServer2.Base;
using MibServer2.Blocks;
using MibServer2.Model;
using MibClient2.Config;
using IMX.API.Client.Services;
using IMX.Model;
using IMX.MibServer2.MapEditor.Block.Models;

namespace IMX.MibServer2.MapEditor.Block.Block
{
    public class MapEditorBlock : MibServerBlock
    {
        MibConfig apiConfig;
        MapClient mapClient;

        private string CustomParameter
        {
            get
            {
                return Properties.GetString("customParameter");
            }
        }

        // Deve-se sempre criar um construtor que implementa a classe base.
        // Veja que assim temos o Usuário logado no sistema e o objeto que ele está editando.
        public MapEditorBlock(MibUser user, MibObject currentObject)
            : base(user, currentObject)
        {
            apiConfig = new MibConfig("ImxApiConfig.mibconfig");
            mapClient = new MapClient(apiConfig.GetString("ImxApiMapUrl"), apiConfig.GetString("oAuthConsumerKey"), apiConfig.GetString("oAuthConsumerSecret"), 1);
        }

        // Primeiro método a ser chamado ao ser instanciado um objeto do Tipo BlockSample.
        // Aqui podemos inserir a criação instâncias, variáveis globais, etc.
        public override void Init()
        {
            if (!CurrentUser.PermissionManager.GetPermission(MibObjectTypes.GetIndex(CurrentObject.MediaType),
                MibPermissionObjectType.MediaType).CanRead)
            {
                throw new Exception("User do not have read permission for this object");
            }
        }

        public override void BeforeUpdate()
        {
        }

        // Método que gera os dados para a visualização, este é o segundo método a ser chamado ao ser instanciado este bloco.
        public override MibServerBlockRenderData GetRenderData()
        {
            var renderData = new MibServerBlockRenderData
            {
                ViewName = "~/Views/Shared/Blocks/MapEditorBlock.aspx"
            };

            var viewData = new MapViewData
            {
                Object = CurrentObject,
                BlockName = Name
            };

            ImxMap mapInfo = null;

            if (CurrentObject.ID != 0)
                mapInfo = mapClient.GetMap(CurrentObject.ID);

            if (mapInfo != null)
            {
                viewData.MapInfo = mapInfo;
                viewData.IsEnabled = true;
            }

            renderData.ViewData = viewData;
            return renderData;
        }

        // Captura todas os scripts da aplicação
        public override List<string> GetScripts()
        {
            return (new List<string>(new[] {
                "Imx.Block.ProgramSchedule.js",
                "Imx.Block.TimelineHelper.js",
                "local_data.js"
            }));
        }

        // Ação obrigatória ao atualizar o objeto
        public override void Update()
        {
            // Captura todos os fields da View que foram serializadas.
            // Para isto é obrigatória a função padrão "BeforeUpdate" no arquivo block.sample.js
            var values = HttpUtility.ParseQueryString(Properties.GetString("postData").Replace(Name + "_", ""));
            var model = MibClient2.Tools.MibJson.FromJsonString<MapEditorModel>(values[0]);

            //Insert Metadata
            IImxMapMetadata resultMetadata = null;
            var mapClient = new MapClient(apiConfig.GetString("ImxApiMapUrl"), apiConfig.GetString("oAuthConsumerKey"), apiConfig.GetString("oAuthConsumerSecret"), 1);
            if (model.mapMetadata.ID == 0)
            {
                resultMetadata = mapClient.InsertMapMetadata(model.mapMetadata);
                mapClient.LinkMapMetadata(this.CurrentObject.ID, resultMetadata.ID);
            }
            else
            {
                resultMetadata = mapClient.UpdateMapMetadata(model.mapMetadata.ID, model.mapMetadata);
            }

            var map = mapClient.GetMap(this.CurrentObject.ID);

            //Insert positions
            foreach (var position in model.positions)
            {
                this.ValidateSeatIndex(position);
                position.MapId = this.CurrentObject.ID;
                position.SectorId = map.SectorId;
            }

            var response = mapClient.InsertMapPositions(model.positions, this.CurrentObject.ID);
        }

        private void ValidateSeatIndex(ImxMapPosition position)
        {
            if (position.SeatIndex < 0)
                throw new Exception("Assento(s) sem índice.");
            if (position.GroupIndex < 0)
                throw new Exception("Assento(s) sem grupo.");
        }
    }
}
