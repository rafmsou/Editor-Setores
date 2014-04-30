/**
*   MIB BLOCK JS
*/
function MapEditorBlock() { }
MapEditorBlock.prototype = new MibServerBlock;
MapEditorBlock.prototype.BeforeUpdate = function (){
    var mapId=$('.textfield.small.off').val();

    var mapMetadata = this.GetMetadataToSave();
    var positions = this.GetMapsPositionsToSave();

    var data = {
        mapMetadata: mapMetadata,
        positions: positions
    };

    this.SetProperty('postData', $.param({data: JSON.stringify(data)}));
};
MapEditorBlock.prototype.updateStatus = function (blockname) {};

var editorJson='';
var mapEditorBlockName = '';

var editor, sectorEditor, seatEditor, bgUrl, seatTypes;

MapEditorBlock.prototype.AfterUpdate=function()
{
}

$(document).ready(function() {
	$('#imxSectorEditor-fill').colorpicker();
    
    $('#seat-matrix-parameters-min-row, #seat-matrix-parameters-max-row').on('keyup', function (e) {
        $(this).val(($(this).val()).toUpperCase());
    });

    $(document).keyup(function(e) {
        if(e.keyCode === 27 && Map.Editor.Globals.selectedShape.length > 0) {
            Map.Editor.unselectAll();
            Map.Editor.Globals.map.draw();
            $('#imxEditorSelectedProperties').hide(250);
        }
    });
});

//////////////////////////////////////////////////////////////////////
//			COLOCAR AQUI OS CALLBACKS DA SELEÇÃO DE LUGARES			//
//////////////////////////////////////////////////////////////////////

MapEditorBlock.prototype.SelectedImageCallback=function(id, name){
    var imageField=$('#'+this.name+'_Image');
    var imageIdField=$('#'+this.name+'_ImageId');
    imageField.val(name);
    imageIdField.val(id);
    $.get(mib.baseUrl+'/MapEditor/GetImageUrl?imageId='+id, function(imageUrl){	
        bgUrl=imageUrl;
    });
}

MapEditorBlock.prototype.GetSeatTypes = function () {
    $.getJSON('/MapEditor/GetElementTypes', function (data) {
        seatTypes = data;

        var select = $('#imxEditorSelected-comboSeatType');
        select.html('');

        for(var i = 0; i < data.length; i++)
        {
            var opt = $(document.createElement('option'));
            opt.val(data[i].Id);
            opt.text(data[i].Title);

            select.append(opt);
        }
    });
}

MapEditorBlock.prototype.LoadEditor=function(){
    var width=parseInt($('#'+this.name+'_Width').val());
    var height=parseInt($('#'+this.name+'_Height').val());
    if(isNaN(width) || isNaN(height)){
        mib.Popups.Alert('Please, enter the map height and width.');
        return;
    }
    if(bgUrl==null){
        mib.Popups.Alert('Please, load the background map in order to continue.');
        return;
    }

    $('#editorToolbar').show();
    $('#propertiesBar').show();
    
	if(editor){
		if(seatEditor) seatEditor._destroy(this);
		if(sectorEditor) sectorEditor._destroy(this);
		if(editor) editor._destroy();
		seatEditor = null;
		sectorEditor = null;
		editor = null;
		$('.kineticjs-content').remove();
	}
	
	if(editorJson != ''){
        editor = new Map.Editor('seatContainer', bgUrl, seatTypes, width, height, editorJson);
    }
	else{
        editor = new Map.Editor('seatContainer', bgUrl, seatTypes, width, height);
    }
}

MapEditorBlock.prototype.SelectedSectorCallback = function(){
    var sectorInfo = this.ArrItemsSelected[0].split('|');
	sectorEditor = new Map.Editor.SectorEditor();
	sectorEditor.insertSectors(sectorEditor, {
		ImxSectorName: sectorInfo[1],
		ImxSectorId: sectorInfo[0]
	});
}

MapEditorBlock.prototype.CopyMapMetadataCallBack = function () {
    var mapInfo = this.ArrItemsSelected[0].split('|');
    var sectorIdTo = parseInt($('input[name*="SECTOR_ID"]').val());
    $.get("/MapEditor/GetMapById?mapIdFrom=" + mapInfo[0], function (map) {
        if (map.SectorId != sectorIdTo) {
            var metadata = jQuery.parseJSON(map.Metadata.Metadata);

            var listPositions = [];

            $.each(metadata.children, function (i, group) {
                if (group.attrs.name == 'SeatGroup') {
                    $.each(group.children, function (j, seat) {
                        listPositions.push(seat.attrs.ImxId);
                    });
                }
            });

            if (listPositions.length > 0) {
                $.ajax({
                    url: "/MapEditor/GetPositions",
                    data: { sectorIdTo: sectorIdTo, listPositions: JSON.stringify(listPositions) },
                    type: "POST",
                    cache: false,
                    async: false,
                    success: function (positions) {
                        $.each(metadata.children, function (i, group) {
                            if (group.attrs.name == 'SeatGroup') {
                                $.each(group.children, function (j, seat) {
                                    var position = positions.filter(function (obj) {
                                        return obj.RowNumber == seat.attrs.ImxSeatRowNumber && obj.ColumnNumber == seat.attrs.ImxSeatColumnNumber
                                    });
                                    seat.attrs.ImxId = position[0].ID;
                                });
                            }
                        });
                    }
                });
            }

            map.Metadata.Metadata = JSON.stringify(metadata);
        }
        editorJson = map.Metadata.Metadata;
        $('#' + mapEditorBlockName + '_Width').val(map.Metadata.Width);
        $('#' + mapEditorBlockName + '_Height').val(map.Metadata.Height);
        $('#' + mapEditorBlockName + '_Image').val(map.Metadata.ImageUrl);
        $('#' + mapEditorBlockName + '_ImageId').val(map.Metadata.ImageId);
        bgUrl = map.Metadata.ImageUrl;
        mibServerBlockManager.GetBlock(mapEditorBlockName).LoadEditor();
    });
}

MapEditorBlock.GetMatrixPositions = function(sectorId, minRow, maxRow, minCol, maxCol, rowAsc, colAsc, rowSequenceType, callback)
{
    var data = {
        sectorId: sectorId,
        minimumRow: minRow,
        maximumRow: maxRow,
        minimumColumn: minCol,
        maximumColumn: maxCol,
        ascendingRow: rowAsc,
        ascendingColumn: colAsc,
        rowSequenceType: rowSequenceType
    };

    $.get("/MapEditor/GetMatrixPositions", data, callback);
}

MapEditorBlock.prototype.GetMetadataToSave = function(){
    $.each(Map.Editor.Globals.map.children, function(i, group){
        if(group.nodeType == 'Shape' && group.shapeType == 'Polygon')
        {
            group.setAttr('opacity',0.0);
        }
    });
    Map.Editor.Globals.stage.draw();
    var metadataId=parseInt($('#'+this.name+'_MapMetadataId').val())
    var width=parseInt($('#'+this.name+'_Width').val());
    var height=parseInt($('#'+this.name+'_Height').val());
    //TODO: Get ID from Mib DOM
    var mapId=$('.textfield.small.off').val();
    var imageId=parseInt($('#' + this.name + '_ImageId').val());
    var metadataJson;
    if(editor!=null)
    {
        editorJson=editor.getJson();
    }
    var block=this;
    var metadataObject={
        ID:metadataId,
        Name:'Map ' + metadataId + ' Metadata',
        Metadata:editorJson,
        Source:1,
        Width:width,
        Height:height,
        ImageId:imageId
    };

    return metadataObject;
};

MapEditorBlock.prototype.GetMapsPositionsToSave = function(){
    var positions = [];

    $.each(Map.Editor.Globals.map.children, function(i, group){
        if(group.nodeType == 'Group'){
            $.each(group.children, function(j, seat){
                var obj = {
                    positionId: seat.attrs.ImxId,
                    groupIndex: seat.attrs.ImxGroup,
                    seatIndex: seat.attrs.ImxIndex,
                    elementTypeId: seat.attrs.ImxImgId,
                    number: seat.attrs.ImxSeatNumber,
                    rowNumber: seat.attrs.ImxSeatRowNumber,
                    columnNumber: seat.attrs.ImxSeatColumnNumber
                };
                positions.push(obj);
            });
        }
    });

    return positions;
};

/**
 * IMX JavaScript Library
 * Copyright 2012-2013, OTT Networks
 * All rights reserveds
 */
Map = {};
(function() {
	Map.Editor = function(container, background, seatTypeSources, canvasWidth, canvasHeight, json){
		this._initEditor(container, background, seatTypeSources, canvasWidth, canvasHeight, json);
	},
	Map.Editor.Globals = {},
	Map.Editor.ToolbarButtons = [],
	Map.Editor.DrawMode = {
		inDrawMode: false,
		hasChanges: false,
		toggleDrawMode: function(){
			if (this.inDrawMode)
			{
				// Set off
				Map.Editor.Globals.stage.off('mouseover');
				Map.Editor.Globals.stage.off('mouseout');
				
				document.body.style.cursor = 'default';
				
				Map.Editor.Globals.editLayer.clear();
				Map.Editor.Globals.editLayer.hide();
				
				Map.Editor.Globals.map.attrs.opacity = 1;
				Map.Editor.Globals.map.draw();			
				this.inDrawMode = false;
				
				KeyboardJS.enable();

				// Reenable Toolbar
				for (var i = 0; i < Map.Editor.ToolbarButtons.length; i++)
					$('#' + Map.Editor.ToolbarButtons[i]).removeAttr('disabled');
				
				// Tell the user
				Map.Editor.writeMessage('Draw mode ended', 5000);
			}
			else
			{
				// Unselect everything, if any
				Map.Editor.unselectAll();
				$('#imxEditorSelectedProperties').hide();
				
				// Activate Edit Layer
				Map.Editor.Globals.editLayer.show();
							
				// Edit Layer functions
				Map.Editor.Globals.stage.on('mouseover', function(){
					document.body.style.cursor = 'crosshair';
				});
				Map.Editor.Globals.stage.on('mouseout', function(){
					document.body.style.cursor = 'default';
				});
						
				// Make background less visible to stand out the edit mode
				Map.Editor.Globals.map.attrs.opacity = 0.5;
				Map.Editor.Globals.map.draw();
				this.inDrawMode = true;
				
				KeyboardJS.disable();
				
				// Disable toolbar
				for (var i = 0; i < Map.Editor.ToolbarButtons.length; i++)
					$('#' + Map.Editor.ToolbarButtons[i]).attr('disabled', 'disabled');
				
				// Inform the user
				Map.Editor.writeMessage('You are in draw mode');
			}
		}
	},
	Map.Editor.prototype = {
		_initEditor: function(_container, _background, _seatTypeSources, _canvasWidth, _canvasHeight, _json){
			// Create instance of DrawMode
			var baseContext = this;
			
			// Init Globals
			Map.Editor.Globals.seatImages = [];
			Map.Editor.Globals.seatImagesLoaded = false;
			Map.Editor.Globals.debug	 = false;
			Map.Editor.Globals.selectedShape = [];
			Map.Editor.Globals.isShift	 = false;
			Map.Editor.Globals.drawMode  = false;
			Map.Editor.Globals.ImxEntities = {};
			Map.Editor.Globals.imageObj  = new Image();
			Map.Editor.Globals.map       = new Kinetic.Layer();
			Map.Editor.Globals.editLayer = new Kinetic.Layer();
			Map.Editor.Globals.msgsLayer = new Kinetic.Layer();
			Map.Editor.Globals.stage     = new Kinetic.Stage({
				container: _container,
				width: 0,
				height: 0
			});
            Map.Editor.Globals.indexSeatGroup = 0;

			Map.Editor.Globals.imageObj.onload = function() {

				// If loading data from json
				if (_json){
					Map.Editor.Globals.map = Kinetic.Node.create(_json);
					Map.Editor.Globals.stage.add(Map.Editor.Globals.map);

                    // Get Max Index Seat Group
                    $.each(Map.Editor.Globals.map.children, function(i, group){
                        if(group.nodeType == 'Group'){
                            $.each(group.children, function(j, seat){
                                if(Map.Editor.Globals.indexSeatGroup < seat.attrs.ImxGroup){
                                    Map.Editor.Globals.indexSeatGroup = seat.attrs.ImxGroup;
                                }
                            });
                        }
                        if(group.nodeType == 'Shape' && group.shapeType=='Polygon')
                        {
                            group.setAttr('opacity',0.5);
                        }
                        if(group.nodeType == 'Shape' && group.shapeType=='Image')
                        {
                            group.setAttr('width',_canvasWidth);
                            group.setAttr('height',_canvasHeight);
                        }
                    });
					
					// Draw background image
					Map.Editor.Globals.stage.get('#RootMap')[0].setImage(Map.Editor.Globals.imageObj);
					
					// Bind seat events
					var seats = Map.Editor.Globals.stage.get('.Seat');
				    for(I = 0; I < seats.length; I++) {
					    seats[I].on('click', Map.Editor.selectElement);
				    }
					
					// Bind sector events
					var sectors = Map.Editor.Globals.stage.get('.Sector');
					for(I=0;I<sectors.length;I++){
						sectors[I].on('click', Map.Editor.selectElement);
						sectors[I].on('mouseover', Map.Editor.elementMouseOver);
						sectors[I].on('mouseout', Map.Editor.elementMouseOut);
					}
				}
				else{			
					var seatMap = new Kinetic.Image({
					  x: 0, y: 0, 
					  image: Map.Editor.Globals.imageObj,
					  width: Map.Editor.Globals.imageObj.width, 
					  height: Map.Editor.Globals.imageObj.height,
					  name: 'Image',
					  id: 'RootMap'
					});
					Map.Editor.Globals.map.add(seatMap);					
					Map.Editor.Globals.stage.add(Map.Editor.Globals.map);
				}
				
				Map.Editor.Globals.map.setWidth((_canvasWidth) ? _canvasWidth : Map.Editor.Globals.imageObj.width);
				Map.Editor.Globals.map.setHeight((_canvasHeight) ? _canvasHeight : Map.Editor.Globals.imageObj.height);
				
				$('#'+_container).width((_canvasWidth) ? _canvasWidth : Map.Editor.Globals.imageObj.width);
				$('#'+_container).height((_canvasHeight) ? _canvasHeight : Map.Editor.Globals.imageObj.height);
				
				Map.Editor.Globals.stage.add(Map.Editor.Globals.editLayer);
				Map.Editor.Globals.stage.add(Map.Editor.Globals.msgsLayer);

				Map.Editor.Globals.map.setZIndex(1);
				Map.Editor.Globals.editLayer.setZIndex(10);
				Map.Editor.Globals.msgsLayer.setZIndex(100);
				
				Map.Editor.Globals.stage.setWidth((_canvasWidth) ? _canvasWidth : Map.Editor.Globals.imageObj.width);
				Map.Editor.Globals.stage.setHeight((_canvasHeight) ? _canvasHeight : Map.Editor.Globals.imageObj.height);
				
				Map.Editor.Globals.editLayer.hide();
				
				// Preload all seat images
				baseContext._loadSeatImages(_seatTypeSources, function(){
					Map.Editor.Globals.seatImagesLoaded = true;
					// if loading from json, apply the seat images and use the same loop to attach bindings to seats
					if (_json){
						var seats = Map.Editor.Globals.stage.get('.Seat');
						for(var I = 0; I < seats.length; I++){
							if (seats[I].shapeType=='Image')
								seats[I].setImage(Map.Editor.Globals.seatImages.GetObj(seats[I].attrs.ImxImgId).Html);
                                
			                seats[I].on('mouseover', function(){
                                Map.Editor.writeMessage(Map.Editor.MouseOverSeatMsg(this));
			                });
			                seats[I].on('mouseout', function(){
				                Map.Editor.writeMessage('');
			                });
						}
						Map.Editor.Globals.stage.draw();
					}
				});
				
				Map.Editor.Globals.stage.draw();
			};
			Map.Editor.Globals.imageObj.src = _background;
			
			// Bind keyboard actions
			KeyboardJS.on('delete', Map.Editor.deleteElement);
			KeyboardJS.on('up', function(e){Map.Editor.moveElement('up',e);});
            KeyboardJS.on('down', function(e){Map.Editor.moveElement('down',e);});
            KeyboardJS.on('left', function(e){Map.Editor.moveElement('left',e);});
            KeyboardJS.on('right', function(e){Map.Editor.moveElement('right',e);});
			
			// Inform the Editor, which buttons id are inside the toolbar
			Map.Editor.ToolbarButtons.push('btnInsertSeats');
			Map.Editor.ToolbarButtons.push('btnInsertSector');

			// Bind toolbar
			this._bindToolbar();
		},
		_bindToolbar: function(){
			$('#imxEditorSelected-btnRemove').bind('click', Map.Editor.deleteElement);
			$('#editorSelected-ungroup').bind('click', Map.Editor.ungroup);
			$('#editorSelected-group').bind('click', Map.Editor.group);
            $('#editorSelected-setSeatIndex').bind('click', Map.Editor.setSeatIndex);
		},
		_loadSeatImages: function(sources, callback){
			var loadedImages = 0;
			for(var I = 0; I < sources.length; I++){
                Map.Editor.Globals.seatImages[I] = { Id: sources[I].Id, Html: new Image() };
				Map.Editor.Globals.seatImages[I].Html.onload = function(){
					if (++loadedImages >= sources.length) callback();
				};
				Map.Editor.Globals.seatImages[I].Html.src = sources[I].ImageUrl;
				Map.Editor.Globals.seatImages[I].Html.setAttribute('data-imxid', sources[I].Id);
			}
		},
		_destroy: function(){
			if (Map.Editor.Globals.selectedShape){
				Map.Editor.Globals.selectedShape = null;
				$('#imxEditorSelectedProperties').hide();
			}
		},
		getJson: function(_shape){
			Map.Editor.unselectAll();
			if (!_shape) _shape = Map.Editor.Globals.map;
			return _shape.toJSON()
		}
	},
	/**
	 * SELECT ELEMENT FUNCTION
	 * The click action of certain elements created on Edit Mode receives this function
	 * to allow it to be selected when clicking outside the Edit Mode.
	 * Some actions can be done only with selected elements
	 **/
	Map.Editor.setSelectedState = function(shape, selected){
        var shapeName = shape.getName();
		if(selected)
		{
			if (shapeName == 'Sector')
			{
				shape.setStrokeWidth(3);
				shape.setStroke('#009CFC');
				shape.setDraggable(true);
			}
			else if (shapeName == 'SeatGroup'){
				shape.setDraggable(true);
				var seats = shape.getChildren();

				for(i=0;i<seats.length;i++){
					if(seats[i].getName() == 'Seat'){
						seats[i].setStrokeWidth(3);
						seats[i].setStroke('#009CFC');
					}
				}
			}
            else if (shapeName == 'Seat') {
                shape.setDraggable(true);
                shape.setStrokeWidth(3);
				shape.setStroke('#009CFC');
            }
		}
		else{
			if (shapeName == 'Sector'){
				shape.setStrokeWidth(1);
				shape.setStroke('#000');
				shape.setDraggable(false);
			}
			else if (shapeName == 'SeatGroup'){
				shape.setDraggable(false);
				var seats = shape.getChildren();
				for(i=0;i<seats.length;i++){
					if(seats[i].getName() == 'Seat'){
						seats[i].setStrokeWidth(null);
						seats[i].setStroke(null);
					}
				}
			}
            else if (shapeName == 'Seat') {
                shape.setDraggable(false);
                shape.setStrokeWidth(null);
				shape.setStroke(null);
            }
		}
	},
	Map.Editor.unselectAll = function(){
		for(var I = Map.Editor.Globals.selectedShape.length - 1; I >= 0; I--)
			Map.Editor.setSelectedState(Map.Editor.Globals.selectedShape.pop(), false);
	},
	Map.Editor.selectElement = function(e){
        
        var selectedElement = this;

        if(Map.Editor.IsGroupSelection()) {
            selectedElement = this.getParent();
        }

		var ignoreSelect = false;
		if (!Map.Editor.DrawMode.inDrawMode && !Map.Editor.Globals.inSeatIndexMode)
		{
			// 1.1 Check the array to see if this element already inside, if so, unselect
			for(var I = 0; I < Map.Editor.Globals.selectedShape.length; I++){
				if (Map.Editor.Globals.selectedShape[I]._id == selectedElement._id){
					//if (e.shiftKey){
						Map.Editor.setSelectedState(Map.Editor.Globals.selectedShape[I], false);
						Map.Editor.Globals.selectedShape.splice(I, 1);
					//}
					if (Map.Editor.Globals.selectedShape.length > 0)
					{
						if(e.shiftKey)
						{
							ignoreSelect = true;
						}
						else
						{
							ignoreSelect = false;
						}
					}
					else
					{
						ignoreSelect = true;
					}
					
					break;
				}
			}
			
			// If the code above requested to stop the select portion, obey it
			if(!ignoreSelect)
			{
			    // 1.2 Right, now, this is a multiple selection? Check for shift. If so, just push, otherwise, clear array and add just one item again.
			    if(e.shiftKey)
			    {
				    // 1.2.1 But hold on! Only SeatGroups together or Sectors. If current is different, delete
				    if (Map.Editor.Globals.selectedShape.length > 0)
					    if (Map.Editor.Globals.selectedShape[0].getName() != selectedElement.getName())
						    Map.Editor.unselectAll();

                    // Add the brand new item!
				    Map.Editor.setSelectedState(selectedElement, true);
				    Map.Editor.Globals.selectedShape.push(selectedElement);
			    }
                else if(e.ctrlKey && !Map.Editor.IsGroupSelection())
                {
                    if (Map.Editor.Globals.selectedShape.length > 0) {
                        var name = Map.Editor.Globals.selectedShape[0].getName();
                        var minX = Map.Editor.Globals.selectedShape[0].getX();
                        var minY = Map.Editor.Globals.selectedShape[0].getY();
                        var maxX = selectedElement.getX();
                        var maxY = selectedElement.getY();

                        Map.Editor.unselectAll();

                        $.each(Map.Editor.Globals.map.children, function(i, group){
                            if(group.nodeType == 'Group')
                            {
				                $.each(group.children, function (j, seat) {
                                    if(seat.getName() == 'Seat') {
                                        var seatX = seat.getX(), seatY = seat.getY();

                                        if(seatX >= minX && seatX <= maxX && seatY >= minY && seatY <= maxY && seat.getName() == name)
                                        {
                                            // Add the brand new item!
				                            Map.Editor.setSelectedState(seat, true);
				                            Map.Editor.Globals.selectedShape.push(seat);
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
			    else // not shift
			    {
				    // 1.3 Clear array
				    Map.Editor.unselectAll();

                    // Add the brand new item!
				    Map.Editor.setSelectedState(selectedElement, true);
				    Map.Editor.Globals.selectedShape.push(selectedElement);
			    }
            }
		}

		// Update Map and UI
		Map.Editor.Globals.map.draw();
		if (Map.Editor.Globals.selectedShape.length > 0
            && Map.Editor.Globals.selectedShape[0].getName() != 'Sector'){
			$('#imxEditorSelectedProperties').show(250);
		}else{
			$('#imxEditorSelectedProperties').hide(250);
		}
	},
    Map.Editor.moveElement = function(direction,e){
        e.preventDefault();
		if (Map.Editor.Globals.selectedShape.length > 0 && !Map.Editor.DrawMode.inDrawMode)
		{
            var increaseAmount=1;
            if(e.shiftKey)
            {
                increaseAmount=10;
            }
			for(var I = Map.Editor.Globals.selectedShape.length - 1; I >= 0; I--)
			{
                var shapeToMove=Map.Editor.Globals.selectedShape[I];
                switch(direction)
                {
                    case 'up':
                        shapeToMove.setY(shapeToMove.getY()-increaseAmount);
                        break;
                    case 'down':
                        shapeToMove.setY(shapeToMove.getY()+increaseAmount);
                        break;
                    case 'left':
                        shapeToMove.setX(shapeToMove.getX()-increaseAmount);
                        break;
                    case 'right':
                        shapeToMove.setX(shapeToMove.getX()+increaseAmount);
                        break;
                }
			}
			$('#imxEditorSelectedProperties').hide(250);
			Map.Editor.Globals.map.draw();
		}
	},
    Map.Editor.OpenMatrixParameters=function()
    {
        $("#seatMatrixParameters").show();
    },
    Map.Editor.CloseMatrixParameters = function()
    {
        $("#seatMatrixParameters").hide();
    },
    Map.Editor.SelectAllSeats=function()
    {
		Map.Editor.unselectAll();
        $.each(Map.Editor.Globals.map.children, function(i, group){
            if(group.nodeType == 'Group')
            {
				// 1.2.2 Add the brand new item!
				Map.Editor.setSelectedState(group, true);
				Map.Editor.Globals.selectedShape.push(group);
            }
        });
        Map.Editor.Globals.map.draw();
    },
    Map.Editor.SearchPositions=function()
    {
        var sectorId = parseInt($('input[name*="SECTOR_ID"]').val());
        var minRow = $("#seat-matrix-parameters-min-row").val();
        var maxRow = $("#seat-matrix-parameters-max-row").val();
        var minCol = parseInt($("#seat-matrix-parameters-min-col").val());
        var maxCol = parseInt($("#seat-matrix-parameters-max-col").val());
        var rowAsc = $("#seat-matrix-parameters-row-order").val()=="1";
        var colAsc = $("#seat-matrix-parameters-col-order").val()=="1";
        var rowSequenceType = $("#seat-matrix-parameters-row-type").val();
        
        $("#seatMatrixParameters").hide();
        seatEditor = new Map.Editor.SeatEditor('matrix');
	    var seatCollection = new Array();

        MapEditorBlock.GetMatrixPositions(sectorId, minRow, maxRow, minCol, maxCol, rowAsc, colAsc, rowSequenceType, function(data) {
            $.each(data, function(i, obj){
		        seatCollection.push({ImxSeatNumber: obj.Number, ImxSeatRowNumber: obj.RowNumber, ImxSeatColumnNumber: obj.ColumnNumber, ImxSeatPositionId: obj.ID, ImxGroupIndex: 0, ImxSeatIndex: 0});
            });	                
	        seatEditor.insertSeatMatrix(seatCollection);
        });
    },
	/**
	 * DELETE ELEMENT FUNCTION
	 * Remove the selected element from the Map
	 **/
	Map.Editor.deleteElement = function(){
		if (Map.Editor.Globals.selectedShape.length > 0 && !Map.Editor.DrawMode.inDrawMode)
		{
			for(var I = Map.Editor.Globals.selectedShape.length - 1; I >= 0; I--)
			{	
				var shape = Map.Editor.Globals.selectedShape.pop(); // Remove from Array
				shape.remove();
			}
			$('#imxEditorSelectedProperties').hide(250);
			Map.Editor.Globals.map.draw();
		}
	},
	Map.Editor.ungroup = function(){
	
		if(Map.Editor.Globals.selectedShape.length > 0){
			if(Map.Editor.Globals.selectedShape[0].getName() != 'SeatGroup'){
				alert('This function only works with Seat Groups');
				return;
			}
		} else { return; }

		if (confirm('Confirm ungroup all your selection?'))
		{
			for(var J = Map.Editor.Globals.selectedShape.length - 1; J >= 0; J--)
			{
				var seats = Map.Editor.Globals.selectedShape[J].getChildren();
		
				if(seats.length > 0){
					var seatsToMove = [];
					for(I=0;I<seats.length;I++){
						if (seats[I].getName() == 'Seat'){
							// Clear selected state
							seats[I].setStrokeWidth(null);
							seats[I].setStroke(null);
                            var seatGroupId = Map.Editor.Globals.indexSeatGroup + 1;
                            Map.Editor.Globals.indexSeatGroup++;
                            seats[I].attrs.ImxGroup = seatGroupId;
                            seats[I].attrs.ImxIndex = 1;
							seatsToMove.push(seats[I]);
						}
					}
					for(I=0;I<seatsToMove.length;I++){
						// Create new group and move it
						var singleGroup = new Kinetic.Group({
							name: 'SeatGroup'
						});
						
						singleGroup.setX(Map.Editor.Globals.selectedShape[J].getX() + seatsToMove[I].getX());
						singleGroup.setY(Map.Editor.Globals.selectedShape[J].getY() + seatsToMove[I].getY());
						
						seatsToMove[I].setX(0);
						seatsToMove[I].setY(0);
						seatsToMove[I].moveTo(singleGroup);
						
						singleGroup.on('click', Map.Editor.selectElement);
						Map.Editor.Globals.map.add(singleGroup);
					}
					// Remove empty group
					Map.Editor.Globals.selectedShape[J].remove();
				}
			}
			Map.Editor.Globals.map.draw();
			Map.Editor.Globals.selectedShape.length = 0; // Clear array
		}
	},
	Map.Editor.group = function(){
		if(Map.Editor.Globals.selectedShape.length > 0){
			if(Map.Editor.Globals.selectedShape[0].getName() != 'SeatGroup'){
				alert('This function only works with Seats');
				return;
			}
		} else { return; }
		
		if (confirm('Confirm you want to group your current selection?'))
		{
			var seatsToMove = [];
			var masterGroup = new Kinetic.Group({
				name: 'SeatGroup'
			});
            
            var seatIndex = 1;
            var seatGroupId = Map.Editor.Globals.indexSeatGroup + 1;
            Map.Editor.Globals.indexSeatGroup++;
			
			// Iterate all selected seat groups
			for(var I = 0; I < Map.Editor.Globals.selectedShape.length; I++)
			{
				var childSeats = Map.Editor.Globals.selectedShape[I].getChildren();
				// Iterate the current group of seats
				for (var J = 0; J < childSeats.length; J++)
				{
					if (childSeats[J].getName() == 'Seat'){
						childSeats[J].setStrokeWidth(null);
						childSeats[J].setStroke(null);
						
						childSeats[J].setX(childSeats[J].getX() + Map.Editor.Globals.selectedShape[I].getX());
						childSeats[J].setY(childSeats[J].getY() + Map.Editor.Globals.selectedShape[I].getY());
						
                        childSeats[J].attrs.ImxGroup = seatGroupId;
                        childSeats[J].attrs.ImxIndex = seatIndex;
						seatsToMove.push(childSeats[J]);
                        seatIndex++;
					}
				}
				// Add all seats
				for(J=0;J<seatsToMove.length;J++){
					seatsToMove[J].moveTo(masterGroup);
				}
				// Remove current group
				Map.Editor.Globals.selectedShape[I].remove();
			}
			// Bind
			masterGroup.on('click', Map.Editor.selectElement);
			// Add
			Map.Editor.Globals.map.add(masterGroup);
			Map.Editor.Globals.map.draw();
			Map.Editor.Globals.selectedShape.length = 0; // Clear Array
		}
	},

    Map.Editor.setSeatIndex = function() {
		if(Map.Editor.Globals.selectedShape.length > 0){
            //Validate exist diferents groups in selectedShape
            if(Map.Editor.Globals.selectedShape.length > 1){
                alert('There are ' + Map.Editor.Globals.selectedShape.length + ' groups selected.');
				return;
            }
            //Validate shape is SeatGroup
			if(Map.Editor.Globals.selectedShape[0].getName() != 'SeatGroup'){
				alert('This function only works with Seats');
				return;
			}
		} else { return; }

        var editedSeats = [];
        Map.Editor.Globals.inSeatIndexMode = true;

        var seats = Map.Editor.Globals.selectedShape[0].getChildren();

        $.each(seats, function (i, obj) {
            obj.on('click', function (e) {
                e.stopPropagation();
                if(editedSeats.Contains(this.attrs.ImxId))
                {
                    editedSeats.RemoveObj(this.attrs.ImxId);
                    this.setStroke('#009CFC');
                }
                else
                {
                    editedSeats.push(this.attrs.ImxId);
                    this.setStroke('#FC9300');
                }
                Map.Editor.Globals.map.draw();
            });
        });

        var btnsSetSeatIndex = $("#imxEditorSelected-btnSaveSeatIndex, #imxEditorSelected-btnCancelSeatIndex");
        var btnsGroupOptions = $("#editorSelected-ungroup, #editorSelected-group, #editorSelected-setSeatIndex, #imxEditorSelected-btnRemove");
        btnsSetSeatIndex.show();
        btnsGroupOptions.hide();

        // Save
        $("#imxEditorSelected-btnSaveSeatIndex").on("click", function (e) {

            if(editedSeats.length < seats.length)
                return mib.Popups.Alert("You must select all positions of the group.", "Error");

            btnsSetSeatIndex.hide();
            btnsGroupOptions.show();

            $.each(editedSeats, function (i, obj) {
                var seat = seats.GetObjByProp(obj, "attrs.ImxId");
                seat.attrs.ImxIndex = i + 1;
            });

            $.each(seats, function (i, obj) {
                obj.off("click");
            });
            
            Map.Editor.Globals.inSeatIndexMode = false;
            Map.Editor.unselectAll();
            Map.Editor.Globals.map.draw();
            $(this).off('click');
        });

        // Cancel
        $("#imxEditorSelected-btnCancelSeatIndex").on("click", function (e) {
            btnsSetSeatIndex.hide();
            btnsGroupOptions.show();

            $.each(seats, function (i, obj) {
                obj.off("click");
            });
            
            Map.Editor.Globals.inSeatIndexMode = false;
            Map.Editor.unselectAll();
            Map.Editor.Globals.map.draw();
            $(this).off('click');
        });
    },

    Map.Editor.setImageOnShapes = function (shapes, imageId)
    {
        if(typeof shapes === "undefined" || shapes.length == 0) return;

        var elementsName = shapes[0].getName();
        var image = Map.Editor.Globals.seatImages.GetObj(imageId);
        
        if(typeof image === "undefined")
            return mib.Popups.Alert("Invalid seat type!", "Error");

        if(elementsName == "SeatGroup")
        {
            for(var i = 0; i < shapes.length; i++)
            {
                this.setImageOnShapes(shapes[i].children, imageId);
            }
        }
        else if(elementsName == "Seat")
        {
            for(var i = 0; i < shapes.length; i++) {
                shapes[i].setImage(image.Html);
                shapes[i].attrs.ImxImgId = image.Id;
            }

            Map.Editor.Globals.map.draw();
        }
    },

	Map.Editor.elementMouseOver = function(){
		this.setOpacity(0.8);
		Map.Editor.Globals.map.draw();
	},
	Map.Editor.elementMouseOut = function(){
		this.setOpacity(0.5);
		Map.Editor.Globals.map.draw();
	},
	Map.Editor.writeMessage = function(message, timeout){
		var context = Map.Editor.Globals.msgsLayer.getContext();
		Map.Editor.Globals.msgsLayer.clear();
		
		context.font = '11pt Calibri';
		context.fillStyle = '#000';
		context.fillText(message, 5, 15);
		
		if (timeout){
			window.setTimeout(function(){
				Map.Editor.Globals.msgsLayer.clear();
			}, timeout);
		}
	},
	Map.Editor.getAttr = function(e, attr) {
		var result = (e.getAttribute && e.getAttribute(attr)) || null;
		if( !result ) {
			var attrs = e.attributes;
			var length = attrs.length;
			for(var i = 0; i < length; i++)
				if(attrs[i].nodeName === attr)
					result = attrs[i].nodeValue;
		}
		return result;
	},
	Map.Editor.pushDic = function(dic, key, value){
		if(!dic) dic = {};
		if(!dic[key]) dic[key] = value;
	},
	Map.Editor.Math = {
		/**
		 * This function calculate the cartesian coordinates to determine the size in pixels of this vector in a plan
		 * Elementary school if you don't recall: http://mathinsight.org/vectors_cartesian_coordinates_2d_3d
		 */
		getVectorSize: function(_pointA, _pointB){
			var a1 = _pointB.x - _pointA.x; // Compensate the fact that the vector do not starts at the axis (0,0)
			var a2 = _pointB.y - _pointA.y;
			
			return Math.round(Math.sqrt(Math.pow(a1, 2) + Math.pow(a2, 2)));
		},
		/**
		 * This is far more complex: http://en.wikipedia.org/wiki/Centroid#Centroid_of_polygon
		 */
		getPolygonCentroid: function(p){
			// In these formulas, the vertices are assumed to be numbered in order of their occurrence along the polygon's perimeter, and the vertex ( xn, yn ) is assumed to be the same as ( x0, y0 )
			p.push(p[0]); // Add x0,y0 to the end of the point array to create the xn,yn
			
			// Get signed area A
			var A = 0;
			for (i=0;i<p.length - 2;i++){
				A += ((p[i].x * p[i+1].y) - (p[i+1].x * p[i].y));
			} A *= 0.5;
			
			// Get Centroid of X
			var c = {x: 0, y: 0}, aux;
			for (i=0;i<p.length - 2;i++){
				aux = ((p[i].x * p[i+1].y) - (p[i+1].x * p[i].y));
				c.x += (p[i].x + p[i+1].x) * aux;
				c.y += (p[i].y + p[i+1].y) * aux;
			} aux = (1 / (6 * A));
			c.x *= aux; c.y *= aux;
			
			return c;
		},
		getCenterSimple: function(p){
			// Just a regular average between all points
			var c = {x: 0, y: 0};
			for (i=0;i<p.length;i++){
				c.x += p[i].x;
				c.y += p[i].y;
			}
			c.x = c.x / p.length;
			c.y = c.y / p.length;
			return c;
		}
	},
    Map.Editor.MouseOverSeatMsg = function(shape){
        return 'Id:' + shape.attrs.ImxId + '; Number:' + shape.attrs.ImxSeatRowNumber + shape.attrs.ImxSeatColumnNumber + '; Group:' + shape.attrs.ImxGroup + '; Index:'+ shape.attrs.ImxIndex;
    },
    Map.Editor.IsGroupSelection = function() {
        return ($("#checkGroupSelection").attr("checked") === "checked");
    }
})();

// SEAT EDITOR
(function(){
	Map.Editor.SeatEditor = function(insertMode){
		this._initSeatEditor(insertMode);
	},
	Map.Editor.SeatEditor.Globals = {},
	Map.Editor.SeatEditor.Properties = [],
	Map.Editor.SeatEditor.prototype = {
		_initSeatEditor: function(_insertMode){
			var baseContext = this; // Preserve the context
			Map.Editor.SeatEditor.Globals.editorSeatGroup = null;
			Map.Editor.SeatEditor.Globals.Keyboard = KeyboardJS.fork();
			Map.Editor.SeatEditor.Globals.insertMode = _insertMode;
			
			// Define properties
			Map.Editor.SeatEditor.Properties.push('seatDistribution');
			Map.Editor.SeatEditor.Properties.push('seatMatrixProperties');

			if (!Map.Editor.Globals.ImxEntities.Seat)
				Map.Editor.Globals.ImxEntities.Seat = {};
			
			// Bind buttons
			$('.btnSeatCommit').bind('click', {base: baseContext}, this.commitSeats);
			$('.btnSeatCancel').bind('click', {base: baseContext}, this.cancelEditing);
			$('.btnSeatApply').bind('click', function(){
				var options = baseContext.getSeatOptions();
				
                if(Map.Editor.SeatEditor.Globals.insertMode == 'matrix') {
					baseContext.distributeSeatsAcrossMatrix();
                }
				else if(Map.Editor.Globals.debug && typeof(console)){
					logger.log('[EDITOR:INITSEATEDITOR] Invalid insert mode');
				}
			});
			
			
			// Add seat images
			if (Map.Editor.Globals.seatImagesLoaded){
				$('.seatImageContainer img').remove();
				for(var I = 0; I < Map.Editor.Globals.seatImages.length; I++){
                    var image = Map.Editor.Globals.seatImages[I];
					$(image).attr('data-imxid', image.Id);
					$('.seatImageContainer').append(image.Html.outerHTML);
				}
				$('.seatImageContainer img').bind('click', function(){
                    var selectedImage = Map.Editor.Globals.seatImages.GetObj($(this).attr('data-imxid'));
					Map.Editor.SeatEditor.Globals.selectedSeatImage = selectedImage;
				});
			}
			
			// Display properties
			if(Map.Editor.SeatEditor.Globals.insertMode=='matrix')
				$('#'+Map.Editor.SeatEditor.Properties[1]).show(250);
			else
				$('#'+Map.Editor.SeatEditor.Properties[0]).show(250);
		},
		_destroy: function(args){
			$('.btnSeatCommit').unbind('click');
			$('.btnSeatCancel').unbind('click');
			$('.btnSeatApply').unbind('click');

			Map.Editor.SeatEditor.Globals.editorSeatGroup = null; // Clear reference
			Map.Editor.SeatEditor.Globals.Keyboard.disable();
			
			// Clear editLayer
			Map.Editor.Globals.editLayer.removeChildren();
			Map.Editor.Globals.editLayer.hide();
			
			// Finish							   .detachEvent('click', handler)  -> to support browsers prior IE9
			Map.Editor.Globals.stage.getContainer().removeEventListener('click', Map.Editor.SeatEditor.Globals.containerHandler, false);
			
			if(!args){
				Map.Editor.DrawMode.toggleDrawMode();
			}
			for (var i = 0; i < Map.Editor.SeatEditor.Properties.length; i++) $('#'+Map.Editor.SeatEditor.Properties[i]).hide(250);
		},
		_buildSeatGroup: function(){
			if (!Map.Editor.SeatEditor.Globals.editorSeatGroup){
				Map.Editor.SeatEditor.Globals.editorSeatGroup = new Kinetic.Group({
					name: 'SeatGroup'
				});
				Map.Editor.Globals.editLayer.add(Map.Editor.SeatEditor.Globals.editorSeatGroup);
			}
		},
		insertSeatMatrix: function(seatArray){
			var baseContext = this;
			
			Map.Editor.DrawMode.toggleDrawMode();
			Map.Editor.SeatEditor.Globals.insertMode = 'matrix';
			
			Map.Editor.SeatEditor.Globals.seatArray = seatArray;
			Map.Editor.writeMessage('Ready to insert ' + Map.Editor.SeatEditor.Globals.seatArray.length + ' seats. Click at any point.');

			Map.Editor.SeatEditor.Globals.containerHandler = function(){
				Map.Editor.SeatEditor.Globals.mousePos = Map.Editor.Globals.stage.getMousePosition();
				baseContext._buildSeatGroup();
				baseContext.distributeSeatsAcrossMatrix();
			}
			Map.Editor.Globals.stage.getContainer().addEventListener('click',
				Map.Editor.SeatEditor.Globals.containerHandler);
		},
		distributeSeatsAcrossMatrix: function(){
			// Attributes
			var attrs = this.getSeatOptions();
			
			if (typeof attrs === 'undefined') return;
			
			// Matrix iterator
			var rowSeatIndex = 0;
			var rowIndex = 0;
			var seatIndex = 0;
			// Ensure group is empty in case of start over
			Map.Editor.SeatEditor.Globals.editorSeatGroup.removeChildren();
			// Reset positioning, unecessary here
			attrs.stepX = 0;
			attrs.stepY = 0;
			
			while(seatIndex < Map.Editor.SeatEditor.Globals.seatArray.length){
				rowSeatIndex = 0;	// Reset row count
                var seatGroupIndex = Map.Editor.Globals.indexSeatGroup + 1;
                Map.Editor.Globals.indexSeatGroup++;
				// Row iterator
				while((attrs.seatsPerRow == 0 || rowSeatIndex < attrs.seatsPerRow) &&
					seatIndex < Map.Editor.SeatEditor.Globals.seatArray.length){
					var posX = (rowSeatIndex * attrs.seatGap) + (rowSeatIndex * attrs.seatImage.width);
					var posY = (rowIndex * attrs.rowGap) + (rowIndex * attrs.seatImage.height);
					
					posX += Map.Editor.SeatEditor.Globals.mousePos.x;
					posY += Map.Editor.SeatEditor.Globals.mousePos.y;

                    var seatObj = Map.Editor.SeatEditor.Globals.seatArray[seatIndex];
                    seatObj.ImxGroupIndex = seatGroupIndex;
                    seatObj.ImxSeatIndex = rowSeatIndex + 1;

					this._placeSeat(
						attrs,
						{x: posX, y: posY},
					    seatObj,
						Map.Editor.SeatEditor.Globals.editorSeatGroup,
						0
					);
					rowSeatIndex++;
					seatIndex++;
				}
				rowIndex++;
			}
			Map.Editor.Globals.editLayer.draw();
			Map.Editor.DrawMode.hasChanges = true;
			
			Map.Editor.writeMessage('If you did any mistake, just click again or APPLY.', 5000)
			
			return true;
		},
		/**
		* This function place the shape into a specified container
		*/
		_placeSeat: function(attrs, offset, seatObj, container, incrementBy){
			if (attrs.seatImage){
				seat = new Kinetic.Image({
					x: offset.x - (attrs.stepX * incrementBy),
					y: offset.y - (attrs.stepY * incrementBy),
					name: 'Seat',
					width: attrs.seatImage.width,
					height: attrs.seatImage.height,
					image: attrs.seatImage,
					rotationDeg: attrs.seatRotation,
					offset: [attrs.seatImage.width / 2, attrs.seatImage.height / 2], // Set rotation axis to the center of the image
					ImxImgId: Map.Editor.getAttr(attrs.seatImage, 'data-imxid'),
					ImxId: seatObj.ImxSeatPositionId,
                    ImxSeatNumber: seatObj.ImxSeatNumber,
                    ImxSeatRowNumber: seatObj.ImxSeatRowNumber,
                    ImxSeatColumnNumber: seatObj.ImxSeatColumnNumber,
                    ImxGroup: seatObj.ImxGroupIndex,
                    ImxIndex: seatObj.ImxSeatIndex
				});
			} else {
				seat = new Kinetic.Ellipse({
					x: offset.x - (attrs.stepX * incrementBy),
					y: offset.y - (attrs.stepY * incrementBy),
					name: 'Seat',
					radius: [attrs.seatDiameter / 2, attrs.seatDiameter / 2],
					fill: '#646464',
					stroke: 0,
					ImxId: seatObj.ImxSeatPositionId,
                    ImxSeatNumber: seatObj.ImxSeatNumber,
                    ImxSeatRowNumber: seatObj.ImxSeatRowNumber,
                    ImxSeatColumnNumber: seatObj.ImxSeatColumnNumber,
                    ImxGroup: seatObj.ImxGroupIndex,
                    ImxIndex: seatObj.ImxSeatIndex
				});
			}
			container.add(seat);
			
			seat.on('mouseover', function(){
                Map.Editor.writeMessage(Map.Editor.MouseOverSeatMsg(this));
			});
			seat.on('mouseout', function(){
				Map.Editor.writeMessage('');
			});
			Map.Editor.pushDic(Map.Editor.Globals.ImxEntities.Seat, seatObj.ImxSeatPositionId, {
				ImxSeatNumber: seatObj.ImxSeatNumber,
                ImxSeatRowNumber: seatObj.ImxSeatRowNumber,
                ImxSeatColumnNumber: seatObj.ImxSeatColumnNumber
			});
            return seat;
		},
		/**
		* This function will read the current UI properties
		*/
		getSeatOptions: function(source)
        {
			if(typeof Map.Editor.SeatEditor.Globals.selectedSeatImage === 'undefined')
                $('.seatImageContainer img').first().click();

			if(Map.Editor.SeatEditor.Globals.insertMode=='matrix'){
				
				// perform basic validations
				if(!Map.Editor.SeatEditor.Globals.mousePos){
					alert('Click at any point of the map to make it possible positioning your seats. We will set to Zero to help you out. Click at any point to redraw');
					Map.Editor.SeatEditor.Globals.mousePos = {x:0, y:0};
				}
				if(!$.isNumeric($('#seatMatrix-seatGap').val())){
					alert('Seat Gap must be a valid number. Usually 10px.');
					return;
				}
				if(!$.isNumeric($('#seatMatrix-rowGap').val())){
					alert('Seats per Row must be a valid number. Usually 10px.');
					return;
				}
				if(!$.isNumeric($('#seatMatrix-rotation').val())){
					alert('Rotation must be a valid number. Try 0 for no rotation, up to 360.');
					return;
				}
				
				return {
					seatRotation: parseInt($('#seatMatrix-rotation').val()),
					rowGap: $('#seatMatrix-rowGap').val(),
					seatGap: $('#seatMatrix-seatGap').val(),
					seatsPerRow: $('#seatMatrix-seatsPerRow').val(),
					seatImage: Map.Editor.SeatEditor.Globals.selectedSeatImage.Html,
					imxSeatArray: Map.Editor.SeatEditor.Globals.seatArray
				}
			}
			// single or multiple
			return {
				seatDiameter: parseInt($('#seatDistribution-seatDiameter').val()),	// TO BE CALCULATED BASED ON THE IMAGE
				seatRotation: parseInt($('#seatDistribution-seatRotation').val()),
				reverse: $('#seatDistribution-reverseNumbering').is(':checked'),
				displayRowLabel: $('#seatDistribution-displayRowLabel').is(':checked'),
				seatImage: Map.Editor.SeatEditor.Globals.selectedSeatImage.Html,
				imxSeatArray: Map.Editor.SeatEditor.Globals.seatArray
			}
		},
		cancelEditing: function(event){
			event.data.base._destroy();
		},
		commitSeats: function(event){
			// Check if is there anything
			if (Map.Editor.SeatEditor.Globals.editorSeatGroup == null || !Map.Editor.DrawMode.hasChanges){
				alert('There are no seats added here. Please add some by clicking UPDATE.');
				return;
			}
			// Move to the map
            var masterGroup = null;
            var seatGroupIndex = 0;
            $.each(Map.Editor.SeatEditor.Globals.editorSeatGroup.children, function(i, seat){
                if(seat != null){
                    seat.on('click', Map.Editor.selectElement);
                    if(seat.attrs.ImxGroup != seatGroupIndex){
                        if(masterGroup != null && masterGroup.children.length > 0){
                            masterGroup.moveTo(Map.Editor.Globals.map);
                        }
                        //Reset
                        seatGroupIndex = seat.attrs.ImxGroup;
                        masterGroup = new Kinetic.Group({ name: 'SeatGroup' });
                    }
                    masterGroup.add(seat);
                }
            });            
            if(masterGroup != null && masterGroup.children.length > 0){
                masterGroup.moveTo(Map.Editor.Globals.map);
            }
			// Destroy
			event.data.base._destroy();
		}
	}
})();

// SECTOR EDITOR
(function(){
	Map.Editor.SectorEditor = function(){
		this._initSectorEditor();
	},
	Map.Editor.SectorEditor.Globals = {},
	Map.Editor.SectorEditor.Properties = [],
	Map.Editor.SectorEditor.prototype = {
		_initSectorEditor: function(){
			var baseContext = this;
			Map.Editor.SectorEditor.Globals.Keyboard = KeyboardJS.fork();
			
			// Add the properties
			Map.Editor.SectorEditor.Properties.push('sectorProperties');
			
			if (!Map.Editor.Globals.ImxEntities.Sector)
				Map.Editor.Globals.ImxEntities.Sector = {};
			
			// Bind buttons
			$('#imxSectorEditor-btnCancel').bind('click', {base: baseContext}, this.cancelEditing);
			$('#imxSectorEditor-btnFinish').bind('click', function(){
				baseContext.commitSector({
					base: baseContext,
					attrs: {
						fill: $('#imxSectorEditor-fill').val()
					}
				})
			});
			$('#imxSectorEditor-btnUpdate').bind('click', function(){
				baseContext.updateSector({
					base: baseContext,
					attrs: {
						fill: $('#imxSectorEditor-fill').val()
					}
				})
			});
			for (var i = 0; i < Map.Editor.SectorEditor.Properties.length; i++) $('#'+Map.Editor.SectorEditor.Properties[i]).show(250);
		},
		_destroy: function(args){
			$('#imxSectorEditor-btnCancel').unbind('click');
			$('#imxSectorEditor-btnFinish').unbind('click');
			$('#imxSectorEditor-btnUpdate').unbind('click');
		
			// Clear references
			Map.Editor.SectorEditor.Globals.Keyboard.disable();
			Map.Editor.SectorEditor.Globals.poly = null;
			Map.Editor.SectorEditor.Globals.lblSector = null;
			Map.Editor.SectorEditor.Globals.canInsert = true;
			
			// Clear editLayer
			Map.Editor.Globals.editLayer.removeChildren();
			Map.Editor.Globals.editLayer.hide();
			
			// Finish							   .detachEvent('click', handler)  -> to support browsers prior IE9
			Map.Editor.Globals.stage.getContainer().removeEventListener('click', Map.Editor.SectorEditor.Globals.containerHandler, false);
			
			if(!args){
				Map.Editor.DrawMode.toggleDrawMode();
			}
			for (var i = 0; i < Map.Editor.SectorEditor.Properties.length; i++) $('#' + Map.Editor.SectorEditor.Properties[i]).hide(250);
		},
		insertSectors: function(caller, sectorData){
			Map.Editor.DrawMode.toggleDrawMode();
			Map.Editor.SectorEditor.Globals.canInsert = true;
			Map.Editor.SectorEditor.Globals.sectorData = sectorData;
			
			$('#imxSectorEditor-name').val(sectorData.ImxSectorName);
			
			Map.Editor.SectorEditor.Globals.containerHandler = function(){
				var mousePos = Map.Editor.Globals.stage.getMousePosition();

				if (Map.Editor.SectorEditor.Globals.poly != null){
					if (Map.Editor.SectorEditor.Globals.canInsert)
                    {
                        var updatedPoints=Map.Editor.SectorEditor.Globals.poly.getPoints();
                        updatedPoints.push(mousePos);
						Map.Editor.SectorEditor.Globals.poly.setPoints(updatedPoints);
                    }
					else
                    {
						Map.Editor.SectorEditor.Globals.canInsert = true;
                    }
				}
				else {
					Map.Editor.SectorEditor.Globals.poly = new Kinetic.Polygon({
						fill: '#FFFFFF',
						stroke: 'black',
						name: 'Sector',
						opacity: 0.8,
						strokeWidth: 1,
						ImxId: sectorData.ImxSectorId
					});
					var updatedPoints=Map.Editor.SectorEditor.Globals.poly.getPoints();
                    updatedPoints.push(mousePos);
					Map.Editor.SectorEditor.Globals.poly.setPoints(updatedPoints);
					Map.Editor.Globals.editLayer.add(Map.Editor.SectorEditor.Globals.poly);
				}
				caller._updateDraw();
			}
			Map.Editor.Globals.stage.getContainer().addEventListener('click', Map.Editor.SectorEditor.Globals.containerHandler);
			Map.Editor.SectorEditor.Globals.Keyboard.on('delete', function(){
				if (Map.Editor.SectorEditor.Globals.poly)
					if (Map.Editor.SectorEditor.Globals.poly.attrs.points.length > 0){
						Map.Editor.SectorEditor.Globals.poly.attrs.points.pop();
						caller._updateDraw();
					}
			});
		},
		_updateDraw: function(){
			Map.Editor.writeMessage(Map.Editor.SectorEditor.Globals.poly.attrs.points.length + ' edge(s). Press <DEL> to undo.');
			Map.Editor.Globals.editLayer.draw();
		},
		updateSector: function(event){
			if (Map.Editor.SectorEditor.Globals.poly != null){
				if (Map.Editor.SectorEditor.Globals.poly.attrs.points.length >= 3){
					Map.Editor.SectorEditor.Globals.poly.attrs.fill = '#' + event.attrs.fill;
					Map.Editor.pushDic(Map.Editor.Globals.ImxEntities.Sector, Map.Editor.SectorEditor.Globals.sectorData.ImxSectorId, {
						ImxSectorName: Map.Editor.SectorEditor.Globals.sectorData.ImxSectorName
					});
					Map.Editor.SectorEditor.Globals.poly.on('mouseover', function(){
						Map.Editor.writeMessage('Sector: ' + Map.Editor.Globals.ImxEntities.Sector[this.attrs.ImxId].ImxSectorName + ', ID ' + this.attrs.ImxId);
					});
					Map.Editor.SectorEditor.Globals.poly.on('mouseout', function(){
						Map.Editor.writeMessage('');
					});
					event.base._updateDraw();
					return true;
				}
			}
			alert('You must add at least 3 edges to make a valid sector area.');
			return false;
		},
		cancelEditing: function(event){
			event.data.base._destroy();
		},
		commitSector: function(event){
			// Move to the map
			if (event.base.updateSector(event)){
				// Attach Events
				Map.Editor.SectorEditor.Globals.poly.on('click', Map.Editor.selectElement);
				Map.Editor.SectorEditor.Globals.poly.on('mouseover', Map.Editor.elementMouseOver);
				Map.Editor.SectorEditor.Globals.poly.on('mouseout', Map.Editor.elementMouseOut);
				// Setup properties
				Map.Editor.SectorEditor.Globals.poly.attrs.opacity = 0.5;
				Map.Editor.SectorEditor.Globals.poly.moveTo(Map.Editor.Globals.map);
				
				// Destroy SectorEditor
				event.base._destroy();
			}
		}
	}
})();