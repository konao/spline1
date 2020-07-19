const $ = require('jquery');
const { Spline, Vec } = require('./spline');
const Map = require('./map');

let myCanvas = document.querySelector('#myCanvas');
let cw = myCanvas.width;
let ch = myCanvas.height;
let ctx = myCanvas.getContext('2d');

// =============================================
//  イベントハンドラ
// =============================================
let map = new Map(document, cw, ch);

$(function() {
    // クリア
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);

    map.clear();
})

$('#myCanvas').mousedown(function(ev) {
    let rect = ev.target.getBoundingClientRect();
    let x = ev.clientX - rect.left;
    let y = ev.clientY - rect.top;

    map.addPoint(x, y);
    map.updateOffScrCanvas();
    map.copyToCanvas(ctx);
});

$('#btClear').click(function() {
    doAnim = false; // stop animation
    
    map.clear();
    map.updateOffScrCanvas();
    map.copyToCanvas(ctx);
});

$('#btAddPath').click(function() {
    map.genNewRoad();
    // console.log('nPaths='+spList.length);
    map.updateOffScrCanvas();
    map.copyToCanvas(ctx);
});

$('#btStartAnim').click(function() {
    console.log('start');
    // debugger;
    map.genNewCars();
    doAnim = true;
});

$('#btStopAnim').click(function() {
    doAnim = false;
});

let doAnim = false;

function renderLoop() {
    if (doAnim) {
        map.copyToCanvas(ctx);
        map.updateCars();
        map.renderCars(ctx);
    }
}

setInterval(renderLoop, 25);

// let sp = new Spline();
// sp.test00();