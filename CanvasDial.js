/* -----------------------------------------------------------------------------

CanvasDial.js
Version 0.9.2
August 1, 2013
Created by Scott Erholm

This Javascript software is designed to make creating HTML5 Canvas dials and 
circular gauges easy. The software should be bundled with an example 
documenting the use and functionality of the CanvasDial.js obejct. This 
software is released under the MIT License, so please honor the license and the 
open source community by retaining the full copyright and license text in all 
distributions and derivations of this software. I would enjoy an email if you
found this software useful, but this is not required. Thank you.

The MIT License (MIT)
Copyright (c) 2013 Scott Erholm and Cayuse Concepts. All Rights Reserved.
 
Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to 
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be 
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
----------------------------------------------------------------------------- */


(function(window) {

function CanvasDial(canvasName) {

	//Canvas Initialization
	if (canvasName === undefined) {
		console.log("ERROR: CanvasDial instantiation attempted without specifying canvas name parameter.");
		return false;
	}

	var canvas = document.getElementById(canvasName);
	var ctx = canvas.getContext("2d");
	
	// This should never happen, but if canvas.width is 0 or undefined, then default to 300
	if (!canvas.width) {
		canvas.width = 300;
	}
	// Since the dial is meant to be round, we can always make the height = width
	canvas.height = canvas.width;

	// Dimensions
	var width  = canvas.width;
	var height = canvas.height;
	
	var centerX = Math.floor(width/2);
	var centerY = Math.floor(height/2);
	
	
	// This function just to deal with jQuery or no jQuery
	function getDataAttr(attr) {
		if (typeof jQuery === 'undefined') {
			// This may not work with Internet Explorer.
			return canvas.getAttribute('data-'+attr);
		}
		else {
			return $(canvas).data(attr);
		}
	}

	// Allow these variables to be accessed directly and set by data- attributes
	this.value      = getDataAttr("value")      || 0;
	this.units      = getDataAttr("units")      || "";
	this.sweep      = getDataAttr("sweep")      || 270;
	this.rotation   = getDataAttr("rotation")   || 135;
	this.minvalue   = getDataAttr("minvalue")   || 0;
	this.maxvalue   = getDataAttr("maxvalue")   || 0;
	this.tickmarks  = getDataAttr("tickmarks")  || 0;
	this.fontfamily = getDataAttr("fontfamily") || "sans-serif";
	this.bgcolor    = getDataAttr("bgcolor")    || "black";
	
	// Getters for "private" vars
	this.getWidth      = function()  {return width;}
	this.getHeight     = function()  {return height;}
	this.getCtx        = function()  {return ctx;}
	this.getCanvas     = function()  {return canvas;}
	this.getCenterX    = function()  {return centerX;}
	this.getCenterY    = function()  {return centerY;}
	this.getCanvasName = function()  {return canvasName;}

	// Few simple utility functions
	this.getRange   = function()    {return this.maxvalue - this.minvalue;}
	this.getRadius  = function()    {return width/2;}
	this.deg2Rad    = function(deg) {return deg * Math.PI / 180;}

	

}

CanvasDial.prototype = {

	constructor: CanvasDial,
	
	///
	// function setBaseParameters : A way to set parameters of the dial.
	// param value : The value to display on the dial or gauge.
	// param units : The units of measure to display if the text is drawn.
	// param sweep : The degrees which the dial will span. Given as an integer from 0-360.
	// param rotation : The degrees to which the starting point is rotated.  Given as an integer from 0-360.
	// param minvalue : The gauge minimum value. Given as an integer which may be negative.
	// param maxvalue : The gauge maximum value. Given as an integer which may be negative.
	// param tickmarks : The default number of tick marks to draw on the sweep. Given as a positive integer.
	// param fontfamily : The font to be used on gauge text. Given as a string confirming to W3C font-family property
	// param bgcolor : The background color of the dial face. Given as a hex color number, or an rgba list.
	///
	setBaseParameters:function(options) {
		this.value      = options.value      || this.value;
		this.units      = options.units      || this.units;
		this.sweep      = options.sweep      || this.sweep;
		this.rotation   = options.rotation   || this.rotation;
		this.minvalue   = options.minvalue   || this.minvalue;
		this.maxvalue   = options.maxvalue   || this.maxvalue;
		this.tickmarks  = options.tickmarks  || this.tickmarks;
		this.fontfamily = options.fontfamily || this.fontfamily;
		this.bgcolor    = options.bgcolor    || this.bgcolor;

		return true;
	},

	///
	// function drawBackground : Draws a circular background for the face of the gauge.
	///
	drawBackground:function() {
		this.getCtx().beginPath();
		this.getCtx().arc(this.getCenterX(), this.getCenterY(), this.getCenterX(), 0, 2 * Math.PI);
		this.getCtx().fillStyle = this.bgcolor;
		this.getCtx().fill();
		
		return true;
	},
	
	///
	// function drawArc : Draws an arc on the dial
	// param start : The starting point for the arc, givin as a value within the numerical range of the gauge
	// param stop : The stopping point for the arc, givin as a value within the numerical range of the gauge
	// param radiusPercent : The radius of the arc as a percentage of the face, where 0 is center, and 100 is the edge
	// param widthPercent : The width of the arc as a percentage of the total radius
	// param color : The color of the arc, given as a hex color number, or an rgba list.
	// param lineCap : One of "butt", "round", or "square".
	///
	drawArc:function(options) {
		
		if (typeof(options) === 'undefined') {
			var options = {};
		}
		
		// Check inputs for reasonable values
		if ( (this.checkValue(options.start, "drawArc") == false) || 
			 (this.checkValue(options.stop, "drawArc") == false)  ||
			 (this.checkPercent(options.radiusPercent, "drawArc") == false) ||
			 (this.checkPercent(options.widthPercent, "drawArc") == false) ) {
			return false;
		}
				
		// default to white and butt end
		options.color   = options.color   || "#fff";
		options.lineCap = options.lineCap || "butt";
	
		
		var absWidth = Math.floor(this.getWidth() * options.widthPercent/100);
		var absRadius = Math.floor(this.getCenterX() * options.radiusPercent/100 - absWidth/2);
		
		options.start -= this.minvalue;
		options.stop -= this.minvalue;
		
		var absStart = this.deg2Rad((options.start/this.getRange() * this.sweep + this.rotation));
		var absStop  = this.deg2Rad((options.stop/this.getRange() * this.sweep  + this.rotation));
				
		this.getCtx().beginPath();
		
		this.getCtx().arc(this.getCenterX(), this.getCenterY(), absRadius, absStart, absStop, false);
		
		this.getCtx().strokeStyle = options.color;
		this.getCtx().lineWidth = absWidth;
		
		this.getCtx().lineCap = options.lineCap;
		
		this.getCtx().stroke();
		
		return true;
	},
	
	///
	// function drawSweep : Draws a complete sweep
	// param radiusPercent : The radius of the arc as a percentage of the face, where 0 is center, and 100 is the edge
	// param widthPercent : The width of the arc as a percentage of the total radius
	// param color : The color of the arc, given as a hex color number, or an rgba list.
	///
	drawSweep:function(options) {
	
		if (typeof(options) === 'undefined') {
			var options = {};
		}

		if (!this.drawArc({start:this.minvalue, stop:this.maxvalue, radiusPercent:options.radiusPercent, widthPercent:options.widthPercent, color:options.color, lineCap:"round"})) {
			console.log("         drawArc called from drawSweep");
		}
		
		// If tick marks are defined, go ahead and draw them now
		if (this.tickmarks) {
			if (!this.drawTicks({radiusPercent:(options.radiusPercent-2), lengthPercent:options.widthPercent, numTicks:this.tickmarks, tickWidth:1, color:this.bgcolor})) {
				console.log("         drawTicks called from drawSweep");
			}
		}
		
		return true;
	},
	
	///
	// function drawSegment : Draws a partial segment on the dial
	// param start : The starting point for the arc, givin as a value within the numerical range of the gauge
	// param stop : The stopping point for the arc, givin as a value within the numerical range of the gauge
	// param radiusPercent : The radius of the arc as a percentage of the face, where 0 is center, and 100 is the edge
	// param widthPercent : The width of the arc as a percentage of the total radius
	// param color : The color of the arc, given as a hex color number, or an rgba list.
	///
	drawSegment:function(options) {
		
		if (typeof(options) === 'undefined') {
			var options = {};
		}

		if (!this.drawArc({start:options.start, stop:options.stop, radiusPercent:options.radiusPercent, widthPercent:options.widthPercent, color:options.color, lineCap:"butt"})) {
			console.log("         drawArc called from drawSegment");
		}
		
		return true;
	},
	
	///
	// function drawTicks : draw tick marks anywhere on the face of the dial
	// param radiusPercent : The radius of the ticks as a percentage of the face, where 0 is center, and 100 is the edge
	// param lengthPercent : The length of the tick mark as a percentage of the total radius
	// param numTicks : The number of tick marks to be divided evenly across the sweep
	// param tickWidth: The thickness of the tick mark. 1 is a line, where 5 would be a fat mark
	// param color : The color of the tick marks, given as a hex color number, or an rgba list.
	///
	drawTicks:function(options) {
		
		if (typeof(options) === 'undefined') {
			var options = {};
		}

		// Check inputs for reasonable values
		if ( (this.checkPercent(options.radiusPercent, "drawTicks") == false) ||
			 (this.checkPercent(options.lengthPercent, "drawTicks") == false) ) {
			return false;
		}
		
		options.color = options.color || this.bgcolor;
		options.numTicks = options.numTicks || this.tickmarks;
		
		var absWidth = Math.floor(this.getWidth() * options.lengthPercent/100);
		var absRadius = Math.floor(this.getCenterX() * options.radiusPercent/100 - absWidth/2);
		
		this.getCtx().strokeStyle = options.color;
		this.getCtx().lineWidth = absWidth;
		this.getCtx().lineCap = "butt";
		
		// TODO: Would be nice to give the option to specify the range of the tick marks
		//       rather than just have ticks spread across the entire sweep.

		// FIXME: If options.numTicks is greater than range, then tickSpacing is zero.
		var tickSpacing = Math.floor(this.getRange() / options.numTicks);

		// Temporary fix to prevent an infinite loop:
		if (tickSpacing == 0) {
			console.log("ERROR: Cannot draw " + options.numTicks + " in a range of " + this.getRange());
			return false;
		}

		for (i=0; i <= this.getRange(); i+=tickSpacing) {
		
			var absStart = this.deg2Rad((i/this.getRange() * this.sweep + this.rotation));
			var absStop  = this.deg2Rad((i/this.getRange() * this.sweep  + options.tickWidth + this.rotation));
			
			this.getCtx().beginPath();
			this.getCtx().arc(this.getCenterX(), this.getCenterY(), absRadius, absStart, absStop, false);
			
			this.getCtx().stroke();
		}
		
		return true;
	},
	
	///
	// function drawScale : Draw the numerical scale around the sweep of the dial
	// param radiusPercent : Position of the numbers as a percentage of the radius, where 0 is center, and 100 is the edge
	// param fontSizePercent : The size of the numbers font as a percentage of the total radius
	// param color : The color of the scale numbers, given as a hex color number, or an rgba list.
	///
	drawScale:function(options) {
	
		if (typeof(options) === 'undefined') {
			var options = {};
		}

		// Check inputs for reasonable values
		if ( (this.checkPercent(options.radiusPercent, "drawScale") == false) ||
			 (this.checkPercent(options.fontSizePercent, "drawScale") == false) ) {
			return false;
		}
		
		// FIXME: If this.tickmarks is not defined, and if range is less than 10, numTicks is all screwed up
		var numTicks = this.tickmarks || this.getRange()/10;
		var fontSize = Math.floor(this.getRadius() * (options.fontSizePercent/100));
		
		// FIXME: if numTicks is larger than range, tickSpacing is teeny
		var tickSpacing = Math.floor(this.getRange() / numTicks);
		
		var localRotation = 0; // Keep track of the total rotation so we can get back
						
		this.getCtx().font = fontSize + "px " + this.fontfamily;
				
		this.getCtx().fillStyle = options.color;
		this.getCtx().textBaseline = "top";
		
		this.getCtx().translate(this.getCenterX(), this.getCenterY());
		
		localRotation = this.rotation + 90;
		
		this.getCtx().rotate(this.deg2Rad(localRotation));
		
		var labelRotation = tickSpacing/this.getRange() * this.sweep;
		
		for (i=this.minvalue; i <= this.maxvalue; i+=tickSpacing) {

			var labelPosition = -Math.floor(this.getCtx().measureText(i).width/2);
			
			this.getCtx().fillText(i, labelPosition, -(options.radiusPercent/100) * this.getRadius());
			
			this.getCtx().rotate(this.deg2Rad(labelRotation));
			
			localRotation+=labelRotation;
		}
		
		// Reset the rotation and origin of the canvas
		this.getCtx().rotate(this.deg2Rad(360 - localRotation));
		this.getCtx().translate(-this.getCenterX(), -this.getCenterY());
		
		return true;
		
	},
	
	///
	// function drawValue : Draws the value and units in an unoccupied part of the dial
	// param value : The actual value to display. Canvas html attribute 'data-value' overrides a passed in value
	// param units : The data units to display. Canvas html attribute 'data-units' overrides a passed in value
	// param fontSizePercent : The size of the numbers font as a percentage of the total radius
	// param fgcolor : The color of the text. Given as a hex color number, or an rgba list.
	// param bgcolor : A background color of a little window behind the text. If omitted, equal to transparent or no fill.
	// param centered : A boolean value that determines whether the value is placed in the dial center. 
	///
	drawValue:function(options) {
	
		if (typeof(options) === 'undefined') {
			var options = {};
		}
		
		if (this.value) {
			options.value = this.value;
		}

		if (this.checkValue(options.value, "drawValue") == false) {
			return false;
		}

		if (this.units) {
			options.units = this.units;
		}

		options.centered = options.centered || false;
		
		var textX = 0;
		var textY = 0;
		
		// Default to white text color
		options.fgcolor = options.fgcolor || "#fff";
	
		options.fontSizePercent = options.fontSizePercent || 20;
		var fontSize = Math.floor(this.getRadius() * (options.fontSizePercent/100));

		this.getCtx().font = fontSize + "px sans-serif";
		
		this.getCtx().translate(this.getCenterX(), this.getCenterY());
		

		var textWidth = this.getCtx().measureText(options.value).width;
		if (this.getCtx().measureText(options.value).width < this.getCtx().measureText(options.units).width) {
			textWidth = this.getCtx().measureText(options.units).width;
		}

		// If the value is not to be centered, then we got some cipherin' to do--
		// try to place the value in the middle of the sweep, and a bit inside
		if (!options.centered) {
			
			// Figure out the angle we need to place the text at
			var theta = 360 - (this.rotation - (360 - this.sweep)/2);
	
			// This is a fudge-factor that moves the text inside, off the edge of the circle
			var towardCenterFudge = this.getWidth()/5;
					
			// Covert radius and angle to polar coordinates
			textX = Math.floor((this.getRadius() - towardCenterFudge) * Math.cos(this.deg2Rad(theta)));
			textY = Math.floor((this.getRadius() - towardCenterFudge) * Math.sin(this.deg2Rad(theta)));
		}
		
		// If a background color is supplied, then draw a rounded line for the background
		if (options.bgcolor) {	
			this.getCtx().beginPath();
			this.getCtx().strokeStyle = options.bgcolor;
			this.getCtx().lineCap = "round";
			this.getCtx().lineWidth = fontSize * 2.2;
			this.getCtx().moveTo(textX-textWidth/2,-textY-1);
			this.getCtx().lineTo(textX+textWidth/2, -textY-1);
			this.getCtx().stroke();
		}
		
		// Draw the text
		this.getCtx().fillStyle = options.fgcolor;
		this.getCtx().textAlign = "center";
		this.getCtx().textBaseline = "middle";
		this.getCtx().fillText(options.value, textX, -textY);
		this.getCtx().textBaseline = "middle";
		this.getCtx().fillText(options.units, textX, -textY+fontSize);
		
		// Reset the origin
		this.getCtx().translate(-this.getCenterX(), -this.getCenterY());
		
		return true;
	},

	
	/// 
	//	function drawPointer : Draws the pointer and points it to the given value
	//	param value : A numerical value to indicate, between the min and max
	//	param radiusPercent : A radius value, given as the percent of the maximum radius
	//	param color : Color value of the pointer
	//	param style : For future use, when different pointer styles are avalable
	///
	drawPointer:function(options) {

		if (typeof(options) === 'undefined') {
			var options = {};
		}

		if (this.value) {
			options.value = this.value;
		}		
	
		options.radiusPercent = options.radiusPercent || 90;

		if ( (this.checkValue(options.value, "drawPointer") == false) || 
			 (this.checkPercent(options.radiusPercent, "drawPointer") == false) ) {
			return false;
		}
		
		options.color = options.color || "#f33";
		
		this.getCtx().translate(this.getCenterX(), this.getCenterY());
		
		options.value -= this.minvalue;
		
		var rotation = this.rotation + 90 + options.value/this.getRange() * this.sweep;
		
		this.getCtx().rotate(this.deg2Rad(rotation ));
		
		this.getCtx().beginPath();
		this.getCtx().fillStyle = options.color;
		this.getCtx().strokeStyle = options.color;
		
		// TODO: Provide a selection of pointer styles
				
		// Start out by drawing the triangle part of the pointer
		this.getCtx().moveTo(-this.getWidth()/40, 0);
		this.getCtx().lineTo(0, -this.getWidth()/2 * options.radiusPercent/100);
		this.getCtx().lineTo(this.getWidth()/40, 0);
		this.getCtx().closePath();
		this.getCtx().fill();
		
		// Now draw the stubby short end of the pointer
		this.getCtx().beginPath();
		this.getCtx().moveTo(0,0);
		this.getCtx().lineWidth = this.getRadius()/10;
		this.getCtx().lineCap = "round";
		this.getCtx().lineTo(0, this.getWidth()/15);
		this.getCtx().stroke();
		
		// Draw the circular part of the pointer
		this.getCtx().beginPath();
		this.getCtx().arc(0,0, this.getRadius()/10, 0, 2*Math.PI);
		this.getCtx().fill();
		
		// Draw a little dot in the center of the circle
		this.getCtx().beginPath();
		this.getCtx().fillStyle = "#111";
		this.getCtx().arc(0,0, this.getRadius()/40, 0, 2*Math.PI);
		this.getCtx().fill();
		
		// Reset the rotation and origin of the canvas
		this.getCtx().rotate(this.deg2Rad(360 - rotation));
		this.getCtx().translate(-this.getCenterX(), -this.getCenterY());
		
		return true;
	},
	
	/// Convenience function to check a numerical value
	checkValue:function(value, func) {
		if (value == null) {
			console.log("ERROR in " + func + " for " + this.getCanvasName() + ": Required value argument missing");
			return false;
		}
		else if ( (value < this.minvalue) || (value > this.maxvalue) ){
			console.log("ERROR in " + func + " for " + this.getCanvasName() + ": Given value " + value + " is not within the range of the dial " + this.minvalue + " - " + this.maxvalue);
			return false;
		}
		else {
			return true;
		}
	},
	
	/// Convenience function to check a numerical percentage
	checkPercent:function(percentage, func) {
		if (percentage == null) {
			console.log("ERROR in " + func + " for " + this.getCanvasName() + ": Required percentage argument missing");
			return false;
		}
		else if ( (percentage > 100) || (percentage < 1) ) {
			console.log("ERROR in " + func + " for " + this.getCanvasName() + ": Given percentage " + percentage + " is not within a valid range of 1 - 100");
			return false;
		}
		else {
			return true;
		}
	},
}

window.CanvasDial = CanvasDial;

} (window));

