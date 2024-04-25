"use strict";

var canvas;
var gl;
var vBuffer;
var cBuffer;
var ball;
var peg;
var triangle_count = 200;
var maxPoints = 15000000;

var pegs = [];
var recs = [];
var displayBall;
var balls = [];

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert( "WebGL 2.0 isn't available" ); }

     //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.1, 1.0, 0.8, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxPoints, gl.STATIC_DRAW );

    // Associate out shader variable with our data buffer

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(positionLoc);
	
	// Add color to the ball
	cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16 * maxPoints, gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);
	

    // ball = makeBall(vec2(0.0, .95));
    // peg = makePeg(vec2(0.0, 0.0));

    for(var i = 0; i < 4; i++){
        var y = 0.5;
        var c = vec2(i * 0.3, y);
        pegs.push(makePeg(c));
        c = vec2(i * -0.3, y);
        pegs.push(makePeg(c));
    }

    for(var i = .5; i < 3.5; i++){
        var y = 0.2;
        var c = vec2(i * 0.3, y);
        pegs.push(makePeg(c));
        c = vec2(i * -0.3, y);
        pegs.push(makePeg(c));
    }

    for(var i = 0; i < 4; i++){
        var y = - 0.1;
        var c = vec2(i * 0.3, y);
        pegs.push(makePeg(c));
        c = vec2(i * -0.3, y);
        pegs.push(makePeg(c));
    }

    for(var i = .5; i < 3.5; i++){
        var y = -0.4;
        var c = vec2(i * 0.3, y);
        pegs.push(makePeg(c));
        c = vec2(i * -0.3, y);
        pegs.push(makePeg(c));
    }

    for(var i = .5; i < 3.5; i++){
        var c = vec2(i * 0.3, -.8);
        recs.push(makeRec(c));
        c = vec2(i * -0.3, -.8);
        recs.push(makeRec(c));
    }

    displayBall = makeBall(vec2(0, .95));





	// grid = makeGrid();
    var vBuffStart;
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    for(var i = 0; i < pegs.length; i++){
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (i * (pegs[i].positions.length)), flatten(pegs[i].positions) );
    }	
    for(var i = 0; i < recs.length; i++){
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * ((pegs.length * pegs[0].positions.length) + (i * recs[i].positions.length)), flatten(recs[i].positions) );
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * ((pegs.length * pegs[0].positions.length) + (recs.length * recs[0].positions.length)), flatten(displayBall.positions) );
	
    var cBuffStart;
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    for(var i = 0; i < pegs.length; i++){
        for(var j = 0; j < pegs[i].positions.length; j++){
            gl.bufferSubData(gl.ARRAY_BUFFER, 16 * ((j) + (i * pegs[0].positions.length)), flatten(pegs[i].color) );
        }
    }
    for(var i = 0; i < recs.length; i++){
        for(var j = 0; j < recs[i].positions.length; j++){
            gl.bufferSubData(gl.ARRAY_BUFFER, 16 * ((j) + (i * recs[0].positions.length) + (pegs.length * pegs[0].positions.length)), flatten(recs[i].color) );
        }
    }
    for(var i = 0; i < displayBall.positions.length; i++){
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (i + (recs.length * recs[0].positions.length) + (pegs.length * pegs[0].positions.length)), flatten(displayBall.color) );
    }

	// for (var i = 0; i < grid.positions.length; i++){
	// 		gl.bufferSubData(gl.ARRAY_BUFFER, 0 + i * 16, flatten(grid.color) );
	// }
	// for(let i = 0; i < 64; i++){
	// 	for(let j = 0; j < circles[i].positions.length; j++){
	// 		gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (grid.positions.length + (i * circles[i].positions.length) + j) , flatten(circles[i].color) );
	// 	}
	// }
	

		// canvas.addEventListener("click", (event) =>
		// {
		// 		//document.getElementById("myAudio").play(); 
		// 		//shotgunBlast.play();
		// 		let click = vec2(event.offsetX, event.offsetY);
		// 		//Offset here????
		// 		let clippedX = convertX(click[0], canvas);
		// 		let clippedY = convertY(click[1], canvas);
		// 		let clippedClick = vec2(clippedX - .05, clippedY + .05);
		// 		//console.log(clippedClick);
		// 		getTile(click);
		// 		render();
		// }
		// );



		


   render();
};


function makeBall(c) {
	var r = 0.05;
   
	var p = [];
	p.push(c);
	
	
	for (var i = 0; i <= triangle_count; i++)
	{
		p.push(vec2(
		r * Math.cos(i * 2.0 * Math.PI / triangle_count) + c[0],
		r * Math.sin(i * 2.0 * Math.PI / triangle_count) + c[1]));
	}
	let col = vec4(  1.0, 1.0, 1.0, 1.0 );
	return {color: col, center:c, radius:r, positions:p};
}

function makePeg(c) {
	var r = 0.025;
   
	var p = [];
	p.push(c);
	
	
	for (var i = 0; i <= triangle_count; i++)
	{
		p.push(vec2(
		r * Math.cos(i * 2.0 * Math.PI / triangle_count) + c[0],
		r * Math.sin(i * 2.0 * Math.PI / triangle_count) + c[1]));
	}
	let col = vec4(  0.0, 0.0, 0.0, 1.0 );
	return {color: col, center:c, radius:r, positions:p};
}

function makeRec(c){
    var width = .02;

    var p = [];

    p.push(vec2(c[0] - width, c[1]));
    p.push(vec2(c[0] + width, c[1]));
    p.push(vec2(c[0] + width, -1));
    p.push(vec2(c[0] - width, -1));

    let col = vec4( 0.0, 0.0, 0.0, 1.0 );
	return {color: col, center:c, width:width, positions:p};
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );

    let drawStart;
    for(let i = 0; i < pegs.length; i++){
        gl.drawArrays( gl.TRIANGLE_FAN, i * pegs[i].positions.length, pegs[i].positions.length);
    }
    for(let i = 0; i < recs.length; i++){
        gl.drawArrays( gl.TRIANGLE_FAN, (i * recs[i].positions.length) + (pegs.length * pegs[0].positions.length), recs[i].positions.length);
    }
    gl.drawArrays( gl.TRIANGLE_FAN, (recs.length * recs[0].positions.length) + (pegs.length * pegs[0].positions.length), displayBall.positions.length);

	
	
	requestAnimationFrame(render);
}