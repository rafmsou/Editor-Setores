<%@ Page Language="C#" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<div id="BLOCO_<%=Model.BlockName %>" class="editBox opened">
    <link rel="stylesheet" rev="stylesheet" href="/Css/jquery.colorpicker.css" type="text/css"
        media="screen" />
    <link rel="stylesheet" rev="stylesheet" href="/Css/IMX.Block.MapEditor.css" type="text/css"
        media="screen" />
    <script type="text/javascript" src="/js/jquery.colorpicker.js"></script>
    <script type="text/javascript" src="/js/Imx.Block.MapEditor.TP.Kineticjs-v4.4.3.js"></script>
    <script type="text/javascript" src="/js/Imx.Block.MapEditor.TP.Keyboard.js"></script>
    <script type="text/javascript" src="/js/Imx.Block.MapEditor.js"></script>
    <form id="form_<%=Model.BlockName%>">
    <script type="text/javascript">
		$(function(){
			mibServerBlockManager.GetBlock('<%=Model.BlockName %>').currentId = <%=this.Model.Object.ID %>;
		});
    </script>
    <div class="top opened">
        <h3 onclick="mibServerBlockManager.GetBlock('<%=Model.BlockName %>').OpenClose('BLOCO_<%=Model.BlockName %>');return(false);"
            id="BLOCO_<%=Model.BlockName %>">
            Map Editor</h3>
        <div class="actionMenu">
        </div>
    </div>
    <table id="table_<%=Model.BlockName%>" class="maintable" cellpadding="0" cellspacing="0"
        width="100%" <%if(Model.Hidebar){%>style="display:none;<%}%>">
        <tr>
            <td class="label">
                <label id="lWidth_<%=Model.BlockName%>">
                    Width:</label>
            </td>
            <td>
                <input type="text" name="<%=Model.BlockName %>_Width" id="<%=Model.BlockName %>_Width"
                    class="textfield" value="<%= Model.MapInfo!=null && Model.MapInfo.Metadata!=null?Model.MapInfo.Metadata.Width:0 %>" />&nbsp;px
            </td>
        </tr>
        <tr>
            <td class="label">
                <label id="Label1">
                    Height:</label>
            </td>
            <td>
                <input type="text" name="<%=Model.BlockName %>_Height" id="<%=Model.BlockName %>_Height"
                    class="textfield" value="<%= Model.MapInfo!=null && Model.MapInfo.Metadata!=null?Model.MapInfo.Metadata.Height:0 %>" />&nbsp;px
            </td>
        </tr>
        <tr>
            <td class="label">
                <label id="Label2">
                    Background:</label>
            </td>
            <td>
                <input type="text" name="<%=Model.BlockName %>_Image" id="<%=Model.BlockName %>_Image"
                    class="textfield" readonly="readonly" value="<%= Model.MapInfo!=null && Model.MapInfo.Metadata!=null?Model.MapInfo.Metadata.ImageUrl:"" %>" />
                <input type="hidden" name="<%=Model.BlockName %>_ImageId" id="<%=Model.BlockName %>_ImageId"
                    value="<%= Model.MapInfo!=null && Model.MapInfo.Metadata!=null?Model.MapInfo.Metadata.ImageId:0 %>" />
                <div class="actionMenu">
                    <ul class="menu">
                        <li><a class="default source" onclick="mib.Selection.OpenSelection('IMAGES', function(data){mibServerBlockManager.GetBlock('<%=Model.BlockName %>').SelectedImageCallback(data,arguments[1])}); return false;"
                            href="#" title="Procurar"></a></li>
                    </ul>
                </div>
            </td>
        </tr>
        <tr>
            <td colspan="2" class="label">
                <input type="button" id="btnLoadEditor" class="btnDefault" value="Load Editor" onclick="mibServerBlockManager.GetBlock('<%=Model.BlockName %>').LoadEditor()"
                    style="margin-right: 5px;" />
                <input type="button" id="btnMapMetadata" class="btnDefault" value="Copy Design" onclick="mib.Selection.OpenSelection('IMX_MAPS',mibServerBlockManager.GetBlock('<%=Model.BlockName %>').CopyMapMetadataCallBack);return false;" />
            </td>
        </tr>
    </table>
    <input type="hidden" name="<%=Model.BlockName %>_MapMetadataId" id="<%=Model.BlockName %>_MapMetadataId"
        value="<%= Model.MapInfo!=null && Model.MapInfo.Metadata!=null?Model.MapInfo.Metadata.ID:0 %>" />
    <script type="text/javascript">
        mapEditorBlockName = '<%=Model.BlockName %>';
        editorJson = '<%= Model.MapInfo!=null && Model.MapInfo.Metadata!=null?Model.MapInfo.Metadata.Metadata:"" %>';
        bgUrl = '<%= Model.MapInfo!=null && Model.MapInfo.Metadata!=null?Model.MapInfo.Metadata.ImageUrl:"" %>';
    </script>
    <div id="mapEditorContainer" class="container" style="">
        <div id="editorToolbar">
            <table class="maintable" style="width: 100%;">
                <tr>
                    <td>
                        <input type="button" class="btnDefault" id="btnInsertSector" value="Insert Sector"
                            onclick="mib.Selection.OpenSelection('IMX_SECTORS',mibServerBlockManager.GetBlock('<%=Model.BlockName %>').SelectedSectorCallback);return false;" />
                        <input type="button" class="btnDefault" id="btnInsertSeats" value="Insert Seats"
                            onclick="Map.Editor.OpenMatrixParameters();return false;" />
                        <input type="button" class="btnDefault" id="btnSelectAllSeats" value="Select All Seats"
                            onclick="Map.Editor.SelectAllSeats();return false;" />
                        <input type="checkbox" id="checkGroupSelection" />Select Groups
                    </td>
                </tr>
            </table>
        </div>
        <div class="editorClear">
        </div>
        <div id="propertiesBar">
            <div id="seatMatrixParameters" style="display: none;">
                <table class="maintable">
                    <tr>
                        <td class="label">
                            Minimum Row:
                        </td>
                        <td>
                            <input type="text" id="seat-matrix-parameters-min-row" class="textfield small" maxlength="3"
                                value="A" />
                        </td>
                        <td class="label">
                            Maximum Row:
                        </td>
                        <td>
                            <input type="text" id="seat-matrix-parameters-max-row" class="textfield small" maxlength="3"
                                value="Z" />
                        </td>
                        <td class="label">
                            Minimum Column:
                        </td>
                        <td>
                            <input type="text" id="seat-matrix-parameters-min-col" class="textfield small" maxlength="3"
                                value="1" />
                        </td>
                        <td class="label">
                            Maximum Column:
                        </td>
                        <td>
                            <input type="text" id="seat-matrix-parameters-max-col" class="textfield small" maxlength="3"
                                value="20" />
                        </td>
                        <td class="label">
                            Row Order:
                        </td>
                        <td>
                            <select id="seat-matrix-parameters-row-order">
                                <option value="1">ASC</option>
                                <option value="0">DESC</option>
                            </select>
                        </td>
                        <td class="label">
                            Column Order:
                        </td>
                        <td>
                            <select id="seat-matrix-parameters-col-order">
                                <option value="1">ASC</option>
                                <option value="0">DESC</option>
                            </select>
                        </td>
                        <td class="label">
                            Row Type:
                        </td>
                        <td>
                            <select id="seat-matrix-parameters-row-type">
                                <option value="1">AA, BB, CC...</option>
                                <option value="2">AA, AB, AC...</option>
                            </select>
                        </td>
                        <td>
                            <input type="button" class="btnDefault" id="Button1" value="Insert" onclick="Map.Editor.SearchPositions();return false;" />
                        </td>
                        <td>
                            <input type="button" class="btnDefault" id="Button2" value="Cancel" onclick="Map.Editor.CloseMatrixParameters(); return false;" />
                        </td>
                    </tr>
                </table>
                <input type="hidden" id="Hidden1" value="14" />
            </div>
            <div id="seatDistribution" style="display: none;">
                <table class="maintable" style="width: 100%;">
                    <tr>
                        <td class="label">
                            Reverse Numbering?
                        </td>
                        <td>
                            <input type="checkbox" id="seatDistribution-reverseNumbering" />
                        </td>
                        <td class="label">
                            Image rotation:
                        </td>
                        <td>
                            <input type="text" id="seatDistribution-seatRotation" class="textfield small" maxlength="3"
                                value="0" />º
                        </td>
                        <td class="label">
                            Seat image:
                        </td>
                        <td>
                            <div class="seatImageContainer" id="seatDistribution-seatImageContainer">
                            </div>
                        </td>
                        <td class="label" style="width: 350px">
                            <div class="actionButtons">
                                <a href="javascript:;" class="btnDefault btnSeatApply" id="imxSeatEditor-btnApplySeatDistribution">
                                    UPDATE</a> <a href="javascript:;" class="btnDefault btnSeatCommit" id="imxSeatEditor-btnFinishEditing">
                                        Finish Editing</a> <a href="javascript:;" class="btnDefault btnSeatCancel" id="imxSeatEditor-btnCancelEditing"
                                            style="color: red">CANCEL</a>
                            </div>
                        </td>
                    </tr>
                </table>
                <input type="hidden" id="seatDistribution-seatDiameter" value="14" />
            </div>
            <div id="sectorProperties" style="display: none;">
                <table class="maintable" style="width: 100%">
                    <tr>
                        <td class="label">
                            Sector Name:
                        </td>
                        <td>
                            <input type="text" id="imxSectorEditor-name" class="textfield-small" value="" disabled="disabled" />
                        </td>
                        <td class="label">
                            Sector Color:
                        </td>
                        <td>
                            <input type="text" class="textfield-small" id="imxSectorEditor-fill" value="F4C402"
                                maxlength="6" />
                        </td>
                        <td class="label">
                            <div class="actionButtons">
                                <a href="javascript:;" class="btnDefault" id="imxSectorEditor-btnUpdate">UPDATE</a>
                                <a href="javascript:;" class="btnDefault" id="imxSectorEditor-btnFinish">FINISH</a>
                                <a href="javascript:;" class="btnDefault" id="imxSectorEditor-btnCancel" style="color: red">
                                    CANCEL</a>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div id="seatMatrixProperties" style="display: none;">
                <table class="maintable" style="width: 100%">
                    <tr>
                        <td class="label" style="white-space: nowrap">
                            Seats/Row:
                        </td>
                        <td style="white-space: nowrap">
                            <input type="text" class="textfield-small" id="seatMatrix-seatsPerRow" value=""
                                maxlength="5" style="width: 50px" />
                        </td>
                        <td style="white-space: nowrap" class="label">
                            Seat gap:
                        </td>
                        <td style="white-space: nowrap">
                            <input type="text" class="textfield-small" id="seatMatrix-seatGap" value="2" maxlength="5"
                                style="width: 50px" />px
                        </td>
                        <td style="white-space: nowrap" class="label">
                            Row gap:
                        </td>
                        <td style="white-space: nowrap">
                            <input type="text" class="textfield-small" id="seatMatrix-rowGap" value="4" maxlength="5"
                                style="width: 50px" />px
                        </td>
                        <td style="white-space: nowrap" class="label">
                            Image rotation:
                        </td>
                        <td style="white-space: nowrap">
                            <input type="text" class="textfield small" id="seatMatrix-rotation" maxlength="4"
                                value="0" style="width: 50px" />º
                        </td>
                        <td style="white-space: nowrap" class="label">
                            Seat image:
                        </td>
                        <td style="white-space: nowrap">
                            <div class="seatImageContainer" id="seatMatrix-seatImageContainer">
                            </div>
                        </td>
                        <td style="white-space: nowrap" class="label">
                            <div class="actionButtons" style="width: 200px">
                                <a href="javascript:;" class="btnDefault btnSeatApply" id="seatMatrix-btnApply">APPLY</a>
                                <a href="javascript:;" class="btnDefault btnSeatCommit" id="seatMatrix-btnFinish">FINISH</a>
                                <a href="javascript:;" class="btnDefault btnSeatCancel" id="seatMatrix-btnCancel"
                                    style="color: red">CANCEL</a>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div id="imxEditorSelectedProperties" style="display: none;">
                <table class="maintable" style="width: 100%">
                    <tr>
                        <td class="label">
                            Group:
                        </td>
                        <td>
                            <a href="javascript:;" class="btnDefault btnUngroup" id="editorSelected-ungroup">Ungroup
                                Seats</a> &nbsp; <a href="javascript:;" class="btnDefault btnGroup" id="editorSelected-group">
                                    Group Seats</a> &nbsp; <a href="javascript:;" class="btnDefault btnSetSeatIndex"
                                        id="editorSelected-setSeatIndex">Set Index</a>
                        </td>
                        <td class="label">
                            <div class="actionButtons">
                                <a href="javascript:;" class="btnDefault" id="imxEditorSelected-btnRemove" style="color: red">
                                    REMOVE</a> <a href="javascript:;" class="btnDefault" id="imxEditorSelected-btnSaveSeatIndex"
                                        style="display: none; color: red">Save</a> <a href="javascript:;" class="btnDefault"
                                            id="imxEditorSelected-btnCancelSeatIndex" style="display: none; color: red">Cancel</a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label">
                            Seat type:
                        </td>
                        <td>
                            <select id="imxEditorSelected-comboSeatType">
                                <option value="1">Default</option>
                            </select>
                            <a href="javascript:;" class="btnDefault" id="imxEditorSelected-btnSaveSeatType"
                                onclick="Map.Editor.setImageOnShapes(Map.Editor.Globals.selectedShape, $('#imxEditorSelected-comboSeatType').val()); return false;">
                                Apply</a>
                        </td>
                        <td class="label">
                        </td>
                    </tr>
                </table>
                <input type="hidden" id="imxEditorSelected-name" value="" />
            </div>
        </div>
        <div class="editorClear">
        </div>
        <div id="seatContainer">
        </div>
    </div>
    </form>
    <script type="text/javascript">
        $(document).ready(function () {
            mibServerBlockManager.GetBlock('<%=Model.BlockName %>').GetSeatTypes();
        });
    </script>
</div>
