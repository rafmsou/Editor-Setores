/// <reference name="mootools-core-1.4.5.js"/>

/*
	Depends on =>
	- JQuery: http://jquery.org/
	- Jquery UI: http://jqueryui.com/
	- Kinetic: http://kineticjs.com/
	- Mootools: http://mootools.net/
*/
var SectorEditor = new Class({
    initialize: function(imagePath){
		this.stage = new Kinetic.Stage({
			container: 'seatCanvas',
			width: 430,
			height: 533
		});

		this.shapesLayer = new Kinetic.Layer();
		this.tooltipLayer = new Kinetic.Layer();
		this.scratchLayer = new Kinetic.Layer();

		// build tooltip
		this.tooltip = new Kinetic.Text({
		   text: '',
		   textFill: 'white',
		   fontFamily: 'Calibri',
		   fontSize: 12,
		   padding: 5,
		   fill: 'black',
		   visible: false,
		   opacity: 0.75,
		   listening: false
		});
		this.tooltipLayer.add(this.tooltip);

		var imageObj = new Image();
		var that = this;
		imageObj.onload = function() {
			that.sectorsImage = new Kinetic.Image({
				  x: 0, 
				  y: 0, 
				  image: imageObj,
				  width: 430,
				  height: 533,
				  name: 'sectorsImage'
			});
			that.sectorsImage.moveToBottom();
			that.shapesLayer.add(that.sectorsImage);
			
			if($('#enableMarks').is(':checked')){
				that.sectorsImage.on('click', function(){
					that.shapeClick();
				});

				that.sectorsImage.on('mousemove', function(evt) {
					that.shapeMouseMove();
			    });
			}
			
			that.stage.add(that.shapesLayer);
			that.stage.add(that.tooltipLayer);
			that.stage.add(that.scratchLayer);
		}

		imageObj.src = imagePath;
    },
    setSectorFormInfo: function(formId, nameFieldId, colorFieldId, idFieldId){
    	this.sectorFormInfo =  {  formId: '#' + formId,
						    	  nameFieldId: '#' + formId + ' #' + nameFieldId,
						    	  colorFieldId: '#' + formId + ' #' + colorFieldId,
						    	  idFieldId: '#' + formId + ' #' + idFieldId };

		//initialize the sector form dialog
		$(this.sectorFormInfo.formId).dialog({
            autoOpen: false,
            height: 300,
            width: 350,
            modal: true
        });

    },
    drawTooltip: function(tooltip, x, y, text){
       this.tooltip.setText(text);
       var maxRight = 530;
       if(x > maxRight) {
         x = maxRight;
       }
       this.tooltip.setPosition(x, y);
       this.tooltip.show();
       this.tooltip.getLayer().draw();
    },
    mapArea: function(){
    	var array = new Array();
		this.shapesLayer.get('.pt').each(function(idx, obj) {
			array.push(obj.attrs.x);
			array.push(obj.attrs.y);
		});

		var firstPoint = this.shapesLayer.get('.pt')[0],
			secondPoint = this.shapesLayer.get('.pt')[1],
			thirdPoint = this.shapesLayer.get('.pt')[2];	
			
		if(typeof firstPoint == 'undefined' || typeof secondPoint == 'undefined' || typeof thirdPoint == 'undefined'){
			alert('Selecione pelo menos 3 pontos.');
			return;
		}
			
		this.traceShape(array);
    },
    traceShape: function(points){
    	var sector = new Kinetic.Polygon({
          points: points,
          fill: 'yellow',
          name: 'section',
          stroke: 'black',
          strokeWidth: 1
        });
			  
		this.shapesLayer.add(sector);
		this.shapesLayer.draw();
		this.clearLayer(this.scratchLayer);
		this.showSectorForm(sector);
    },
    showSectorForm: function(sectorShape){
    	 var that = this;

    	 var formButtons = [ 
		    { 
		      text: "Salvar", 
		      click: function() { 
		      		var attrs = { 
		      			sectionName: $(that.sectorFormInfo.nameFieldId).val(),
		      			id: $(that.sectorFormInfo.idFieldId).val(),
		      			fill: $(that.sectorFormInfo.colorFieldId).val()};
		      		console.log(sectorShape);
		      		console.log(attrs);
		      		sectorShape.setAttrs(attrs);
		      		that.bindShapeEvents(sectorShape);
		      		that.removeMarks();

		      		that.clearSectionFormFields();
		      		$(this).dialog("close");
		       } 
		    },
		    { 
		      text: "Remover", 
		      click: function() { 
		      		sectorShape.remove();
		      		that.removeMarks();

		      		that.clearSectionFormFields();
		      		$(this).dialog("close");
		       } 
		    }
		];

	 	$(that.sectorFormInfo.nameFieldId).val(sectorShape.attrs.sectionName);
		$(that.sectorFormInfo.idFieldId).val(sectorShape.attrs.id);
		$(that.sectorFormInfo.colorFieldId).val(sectorShape.attrs.fill);

		$(this.sectorFormInfo.formId).dialog('option', 'buttons', formButtons);
    	$(this.sectorFormInfo.formId).dialog('open');
    },
    bindShapeEvents: function(shape){
    	var that = this;
    	shape.on('mouseover', function(evt) {
			var shape = evt.shape;
			shape.setOpacity(0.7);
			that.shapesLayer.draw();
	    });
	    shape.on('mouseout', function(evt) {
	        var shape = evt.shape;
	        shape.setOpacity(1);
	        that.shapesLayer.draw();
	        that.tooltip.hide();
	        that.tooltipLayer.draw();
	    });
	    shape.on('mousemove', function(evt) {
	        var shape = evt.shape;
	        var mousePos = that.stage.getMousePosition();
	        var x = mousePos.x + 15;
	        var y = mousePos.y + 20;
	        that.drawTooltip(that.tooltip, x, y, shape.attrs.sectionName);
	    });
	    shape.on('click', function(evt) {
	    	var shape = evt.shape;
	    	that.showSectorForm(shape);
	    });
    },
    clearSectionFormFields: function(){
    	$(this.sectorFormInfo.nameFieldId).val('');
		$(this.sectorFormInfo.idFieldId).val('');
		$(this.sectorFormInfo.colorFieldId).val('');
    },
    removeMarks: function(){
    	this.shapesLayer.get('.pt').each(function(){
			this.remove();
		});
		this.shapesLayer.get('.marker').each(function(){
			this.remove();
		});
		this.clearLayer(this.scratchLayer);
		this.shapesLayer.draw();
    },
    setMarks: function(enable){
    	if(enable)
		{
			var that = this;
			this.sectorsImage.on('click', function(){
				that.shapeClick();
			});
			this.sectorsImage.on('mousemove', function(){
				that.shapeMouseMove();
			});
		}
		else
		{
			this.sectorsImage.off('click');
			this.sectorsImage.off('mousemove');
			this.clearLayer(this.scratchLayer);
		}
    },
    setDraggable: function(enable){
    	var elements = this.shapesLayer.get('.section');
		if(enable)
		{
			elements.each(function(idx, ele){
				ele.setDraggable(true);
			});
		}
		else
		{
			elements.each(function(idx, ele){
				ele.setDraggable(false);
			});
		}
    },
    shapeClick: function(){
    	var mousePos = this.stage.getMousePosition();
		var x = mousePos.x;
		var y = mousePos.y;

		var circle = new Kinetic.Circle({
			x: x,
			y: y,
			radius: 2,
			fill: 'red',
			name: 'pt'
		});

		//drawLine();
		this.lastPoint = { x: x, y: y };
		if(this.stage.get('.pt').length > 0){

			var pt1 = { x: this.stage.get('.pt')[this.stage.get('.pt').length - 1].attrs.x, y: this.stage.get('.pt')[this.stage.get('.pt').length - 1].attrs.y };
			var pt2 = { x: mousePos.x, y: mousePos.y };
			var pts = new Array();
			pts.push(pt1);
			pts.push(pt2);

			var line = new Kinetic.Line({
				points: pts,
				fill: 'red',
				name: 'marker',
				strokeWidth: 1,
				stroke: 'black'
			});

			this.shapesLayer.add(line);
		}

		this.shapesLayer.add(circle);
		this.shapesLayer.draw();
    },
    shapeMouseMove: function(){
    	if(typeof this.lastPoint == 'undefined' || secEditor.shapesLayer.get('.pt').length == 0)
			return;

    	this.scratchLayer.get('.ruleLine').each(function(){
			this.remove();
		});

		var pts = new Array();
		pts.push( { x: this.lastPoint.x, y: this.lastPoint.y });
		pts.push( { x: this.stage.getMousePosition().x, y: this.stage.getMousePosition().y });

		var line = new Kinetic.Line({
			points: pts,
			fill: 'red',
			name: 'ruleLine',
			strokeWidth: 1,
			stroke: 'black',
			listening: false
		});

		this.scratchLayer.add(line);
		this.scratchLayer.draw();
    },
    clearLayer: function(layer){
    	layer.getChildren().each(function(ele){
			console.log(ele);
			ele.remove();
		});
		layer.draw();
    },
    generateJson: function(elem){
    	elem.val(this.stage.toJSON());
    }
});