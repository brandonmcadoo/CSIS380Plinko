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

var mousePos;

var ballNum = 4;
var clickNum = 0;

var gravity = .00001;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    //  Configure WebGL

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 1.0, 0.8, 1.0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxPoints, gl.STATIC_DRAW);

    // Associate out shader variable with our data buffer

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // Add color to the ball
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxPoints, gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);


    // ball = makeBall(vec2(0.0, .95));
    // peg = makePeg(vec2(0.0, 0.0));

    for (var i = 0; i < 4; i++) {
        var y = 0.5;
        var c = vec2(i * 0.3, y);
        pegs.push(makePeg(c));
        c = vec2(i * -0.3, y);
        pegs.push(makePeg(c));
    }

    for (var i = .5; i < 3.5; i++) {
        var y = 0.2;
        var c = vec2(i * 0.3, y);
        pegs.push(makePeg(c));
        c = vec2(i * -0.3, y);
        pegs.push(makePeg(c));
    }

    for (var i = 0; i < 4; i++) {
        var y = - 0.1;
        var c = vec2(i * 0.3, y);
        pegs.push(makePeg(c));
        c = vec2(i * -0.3, y);
        pegs.push(makePeg(c));
    }

    for (var i = .5; i < 3.5; i++) {
        var y = -0.4;
        var c = vec2(i * 0.3, y);
        pegs.push(makePeg(c));
        c = vec2(i * -0.3, y);
        pegs.push(makePeg(c));
    }

    for (var i = .5; i < 3.5; i++) {
        var c = vec2(i * 0.3, -.8);
        recs.push(makeRec(c));
        c = vec2(i * -0.3, -.8);
        recs.push(makeRec(c));
    }

    displayBall = makeBall(vec2(0, .95));

    for (var i = 0; i < ballNum; i++) {
        balls.push(makeBall(vec2(0, .95)));
    }





    // grid = makeGrid();
    var vBuffStart;
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    for (var i = 0; i < pegs.length; i++) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (i * (pegs[i].positions.length)), flatten(pegs[i].positions));
    }
    for (var i = 0; i < recs.length; i++) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * ((pegs.length * pegs[0].positions.length) + (i * recs[i].positions.length)), flatten(recs[i].positions));
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * ((pegs.length * pegs[0].positions.length) + (recs.length * recs[0].positions.length)), flatten(displayBall.positions));
    for (var i = 0; i < balls.length; i++) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * ((i * balls[i].positions.length) + (pegs.length * pegs[0].positions.length) + (recs.length * recs[0].positions.length) + displayBall.positions.length), flatten(balls[i].positions));
    }

    var cBuffStart;
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    for (var i = 0; i < pegs.length; i++) {
        for (var j = 0; j < pegs[i].positions.length; j++) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 16 * ((j) + (i * pegs[0].positions.length)), flatten(pegs[i].color));
        }
    }
    for (var i = 0; i < recs.length; i++) {
        for (var j = 0; j < recs[i].positions.length; j++) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 16 * ((j) + (i * recs[0].positions.length) + (pegs.length * pegs[0].positions.length)), flatten(recs[i].color));
        }
    }
    for (var i = 0; i < displayBall.positions.length; i++) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (i + (recs.length * recs[0].positions.length) + (pegs.length * pegs[0].positions.length)), flatten(displayBall.color));
    }

    canvas.addEventListener("mousemove", (event) => {

        let xCoordinate = convertX(event.clientX, canvas);
        let yCoordinate = convertY(event.clientY, canvas);
        mousePos = vec2(xCoordinate, yCoordinate)
        if (xCoordinate + displayBall.radius > 1.0)
            xCoordinate = 1 - displayBall.radius;
        else if (xCoordinate - displayBall.radius < -1.0)
            xCoordinate = -1 + displayBall.radius;
        displayBall.positions[0][0] = xCoordinate;
        for (var i = 0; i < balls.length; i++) {
            if (!balls[i].dropping) {
                balls[i].positions[0][0] = xCoordinate;
            }
        }

        for (var i = 1; i <= triangle_count + 1; i++) {
            displayBall.positions[i][0] = displayBall.radius * Math.cos(i * 2.0 * Math.PI / triangle_count) + displayBall.positions[0][0];
        }
        for (var i = 0; i < balls.length; i++) {
            if (!balls[i].dropping) {
                for (var j = 1; j <= triangle_count + 1; j++) {
                    balls[i].positions[j][0] = balls[i].radius * Math.cos(j * 2.0 * Math.PI / triangle_count) + balls[i].positions[0][0];
                }
            }
        }
        updateBuffer();
        render();

    });

    canvas.addEventListener("click", (event) => {
        var index = clickNum % ballNum;
        balls[index].dropping = true;
        balls[index].yOffset = -.002;
        clickNum++;
    });
    updateBuffer();
    render();
};

function convertX(clickX, canvas) {
    return 2 * clickX / canvas.width - 1;
}

function convertY(clickY, canvas) {
    return 2 * (canvas.height - clickY) / canvas.height - 1;
}

function updateBuffer() {
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * ((pegs.length * pegs[0].positions.length) + (recs.length * recs[0].positions.length)), flatten(displayBall.positions));
    for (var i = 0; i < balls.length; i++) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * ((i * balls[i].positions.length) + (pegs.length * pegs[0].positions.length) + (recs.length * recs[0].positions.length) + displayBall.positions.length), flatten(balls[i].positions));
    }
}


function makeBall(c) {
    var r = 0.05;

    var p = [];
    p.push(c);
    var drop = false;
    var xOff = 0.0;
    var yOff = 0.0;


    for (var i = 0; i <= triangle_count; i++) {
        p.push(vec2(
            r * Math.cos(i * 2.0 * Math.PI / triangle_count) + c[0],
            r * Math.sin(i * 2.0 * Math.PI / triangle_count) + c[1]));
    }
    let col = vec4(1.0, 1.0, 1.0, 1.0);
    return { color: col, center: c, radius: r, positions: p, dropping: drop, xOffset: xOff, yOffset: yOff };
}

function makePeg(c) {
    var r = 0.025;

    var p = [];
    p.push(c);


    for (var i = 0; i <= triangle_count; i++) {
        p.push(vec2(
            r * Math.cos(i * 2.0 * Math.PI / triangle_count) + c[0],
            r * Math.sin(i * 2.0 * Math.PI / triangle_count) + c[1]));
    }
    let col = vec4(0.0, 0.0, 0.0, 1.0);
    return { color: col, center: c, radius: r, positions: p };
}

function makeRec(c) {
    var width = .02;

    var p = [];

    p.push(vec2(c[0] - width, c[1]));
    p.push(vec2(c[0] + width, c[1]));
    p.push(vec2(c[0] + width, -1));
    p.push(vec2(c[0] - width, -1));

    let col = vec4(0.0, 0.0, 0.0, 1.0);
    return { color: col, center: c, width: width, positions: p };
}

function checkPegCollision(ball){
    let ballx = ball.positions[0][0];
    let bally = ball.positions[0][1];
    let pegx;
    let pegy;
    let i = 0;
    while(i < pegs.length){
        pegx = pegs[i].positions[0][0];
        pegy = pegs[i].positions[0][1];

        let changeX = ballx - pegx;
        let changeY = bally - pegy;
        let distance = Math.sqrt((changeX * changeX) + (changeY * changeY));
        if(distance < 0.075){
            let div = .002 / distance;
            ball.xOffset = changeX * div;
            ball.yOffset = changeY * div;
            i = pegs.length;
        }
        i++;
    }
}

function checkWallCollision(ball){
    let ballx = ball.positions[0][0];
    let bally = ball.positions[0][1];
    let lWall = -0.95;
    let rWall = 0.95;
    if(ballx < lWall || ballx > rWall){
        ball.xOffset *= -1;
    }
}

function checkRecsCollision(ball){
    let ballx = ball.positions[0][0];
    let bally = ball.positions[0][1];

    if(bally < -0.8){
        let i = 0;
        while(i < recs.length){
            let leftx = recs[i].positions[0][0]
            let rightx = recs[i].positions[1][0]
    
            if(ballx <= leftx && ballx >= rightx){
                ball.yOffset *= -1;
            }
            if(Math.abs(ballx - leftx) <= .05 || Math.abs(ballx - rightx) <= .05){
                ball.xOffset *= -1;
                i = recs.length;
            }
            i++;
        }
    }
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

    // var yChange = .01;
    // for (var i = 0; i < balls.length; i++) {
    //     if (balls[i].dropping) {
    //         for (var j = 0; j < balls[i].positions.length; j++) {
    //             balls[i].positions[j][1] -= yChange;
    //         }
    //     }
    //     if (balls[i].positions[0][1] <= -1.05) {
    //         balls[i].dropping = false;

    //         balls[i].positions[0] = vec2(mousePos[0], 0.95);
    //         for (var j = 0; j <= triangle_count; j++) {
    //             balls[i].positions[j + 1] = (vec2(
    //                 balls[i].radius * Math.cos(j * 2.0 * Math.PI / triangle_count) + mousePos[0],
    //                 balls[i].radius * Math.sin(j * 2.0 * Math.PI / triangle_count) + 0.95));
    //         }
    //     }
    // }

    for (let i = 0; i < balls.length; i++) {
        for (let j = 0; j < balls[i].positions.length; j++) {
            balls[i].positions[j][0] += balls[i].xOffset;
            balls[i].positions[j][1] += balls[i].yOffset;
        }

        if (balls[i].positions[0][1] <= -1.05 || balls[i].positions[0][1] >= 1.05 || balls[i].positions[0][0] <= -1.05 || balls[i].positions[0][0] >= 1.05) {
            balls[i].dropping = false;

            balls[i].xOffset = 0.0;
            balls[i].yOffset = 0.0;

            balls[i].positions[0] = vec2(mousePos[0], 0.95);
            for (var j = 0; j <= triangle_count; j++) {
                balls[i].positions[j + 1] = (vec2(
                    balls[i].radius * Math.cos(j * 2.0 * Math.PI / triangle_count) + mousePos[0],
                    balls[i].radius * Math.sin(j * 2.0 * Math.PI / triangle_count) + 0.95));
            }
        }
        checkPegCollision(balls[i]);
        checkWallCollision(balls[i]);
        checkRecsCollision(balls[i]);
    }
    updateBuffer();

    for(let i = 0; i < balls.length; i++){
        if (balls[i].dropping){
            balls[i].yOffset -= gravity;
        }
    }

    for (let i = 0; i < pegs.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i * pegs[i].positions.length, pegs[i].positions.length);
    }
    for (let i = 0; i < recs.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, (i * recs[i].positions.length) + (pegs.length * pegs[0].positions.length), recs[i].positions.length);
    }
    gl.drawArrays(gl.TRIANGLE_FAN, (recs.length * recs[0].positions.length) + (pegs.length * pegs[0].positions.length), displayBall.positions.length);
    for (let i = 0; i < balls.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, (i * balls[i].positions.length) + (recs.length * recs[0].positions.length) + (pegs.length * pegs[0].positions.length) + displayBall.positions.length, balls[0].positions.length);
    }


    requestAnimationFrame(render);
}