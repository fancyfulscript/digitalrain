//GLOBAL
window.addEventListener('load', initApp);

function initApp(event) {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext('2d');

    const div = document.getElementById("content");

    const style = window.getComputedStyle(div);
    ctx.canvas.width = parseInt(style.width.split('px')[0]);
    ctx.canvas.height = parseInt(style.height.split('px')[0]);
    const h = ctx.canvas.height;
    const w = ctx.canvas.width;

    const animation = new FrameAnimation(w, h);
    animation.initialize();
    const frames = new EngineRenderer(30);

    function render() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, animation.w, animation.h);
        animation.render(ctx);
    }
    /********************************************************
    ////                    SplashScreen
     ********************************************************/
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, animation.w, animation.h);
    ctx.font = `35px serif`;
    ctx.fillStyle = "green";
    ctx.textAlign = "center";
    ctx.fillText("Press Space to Start", w / 2, h / 2)
    this.addEventListener("keydown", (event) => {
        // console.log(`KeyboardEvent: key='${event.key}' | code='${event.code}'`);
        if (event.code == "Space") {
            if (frames.id != 0) frames.joint();
            else frames.run(render.bind(this));
        }
    }, true);
}

/********************************************************
 *    EngineRenderer : requestAnimationFrame Manager     *
 ********************************************************/
function EngineRenderer(fps) {
    this.fps = fps;
    this.trigger = 1000 / fps;
}

EngineRenderer.prototype.id = 0;
EngineRenderer.prototype.time = 0;
EngineRenderer.prototype.delta = 0;
EngineRenderer.prototype.timeRef = 0

EngineRenderer.prototype.run = function (callback) {
    cancelAnimationFrame(this.id);
    this.time = Date.now();
    this.delta = this.time - this.timeRef;

    if (this.delta > this.trigger) {
        this.timeRef = this.time - (this.delta % this.trigger);
        callback();
    }
    this.id = requestAnimationFrame(this.run.bind(this, callback));
}

EngineRenderer.prototype.joint = function () {
    cancelAnimationFrame(this.id);
    this.id = 0;
}

/**********************************
 *    FrameAnimation : scene      *
 **********************************/

function FrameAnimation(w, h) {

    this.h = h;
    this.w = w;

    this.fontSize = 12;
    this.buffer = [];

    this.frame = 0;
}

FrameAnimation.prototype.initialize = function () {

    this.length = Math.round(this.h / this.fontSize);
    this.stride = Math.round(this.w / this.fontSize);

    for (let index = 0; index < this.stride; index++)
        this.buffer.push(new GlyphColumn(this.length, this.fontSize, index));
}

FrameAnimation.prototype.render = function (ctx) {
    this.buffer.forEach(elt => elt.render(ctx));
    this.frame++;
}

/********************************
 *  
 ********************************/
function GlyphColumn(length, fontSize, colNum) {

    this.fontSize = fontSize;
    this.index = colNum;
    this.length = length;
    this.initialize();
}

GlyphColumn.prototype.initialize = function () {
    this.buffer = [];
    this.lifeCycle = Math.random() * 400;
    this.frame = 0;
    const delay = Math.random() * 3;
    for (let i = 0; i < this.length; i++) {
        const elt = new Glyph(i, this.index, this.fontSize);
        elt.delay = delay + (delay * elt.y) / 5;
        this.buffer.push(elt);
    }
}

GlyphColumn.prototype.render = function (ctx) {

    if (this.frame < this.lifeCycle) this.buffer.forEach(elt => elt.render(ctx));
    else {
        if (this.frame < this.lifeCycle + 100) {
            this.buffer.forEach((elt) => {
                elt.state = elt.STATE.RELEASE;
                elt.render(ctx);
            });
        } else this.initialize();
    }
    this.frame++;
}
/****************************************
 *                    Glyph             *
 ****************************************/
function Glyph(index, colNum, size = 20) {
    this.char = this.getGlyph();
    this.size = size;
    this.x = colNum * this.size;
    this.y = this.size + index * this.size;
    this.delay += this.y;
}

Glyph.prototype.red = 0;
Glyph.prototype.green = 255;
Glyph.prototype.blue = 0;
Glyph.prototype.alpha = 0;
//
Glyph.prototype.state = 0;
Glyph.prototype.STATE = { FADE_IN: 0, BRIGHT: 1, GREEN: 2, REM_GREEN: 3, FADE_OUT: 4, RELEASE: 5 };
Glyph.prototype.frame = 0;
//Tween PROPS
Glyph.prototype.startTime = -1;
Glyph.prototype.delay = 0;
//collect interesting glyphs (Japan Kana)
Glyph.prototype.glyphs = [];
for (let i = 12360; i < 12438; i++)Glyph.prototype.glyphs.push(String.fromCharCode(i));
for (let i = 12442; i < 12540; i++)Glyph.prototype.glyphs.push(String.fromCharCode(i));
//
Glyph.prototype.getGlyph = function (index = -1) {
    index = index == -1 ? Math.floor(Math.random() * this.glyphs.length) : index;
    return this.glyphs[index];
}

Glyph.prototype.render = function (ctx) {

    this.compute();

    ctx.font = `${this.size}px serif`;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.strokeText(this.char, this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.fillText(this.char, this.x, this.y);
}

Object.defineProperty(Glyph.prototype, "color", {
    get: function color() {
        return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`;
    }
});

Glyph.prototype.compute = function () {
    this.frame++;
    if (this.frame < this.delay) return;

    if (this.startTime == -1) this.startTime = new Date();

    const t = new Date() - this.startTime;

    switch (this.state) {

        case this.STATE.FADE_IN: this.fadeIn(t); break;

        case this.STATE.BRIGHT: this.brighting(t); break;

        case this.STATE.GREEN: this.doGreen(t); break;

        case this.STATE.REM_GREEN: this.soften(t); break;

        case this.STATE.FADE_OUT: this.fadeOut(t); break;

        case this.STATE.RELEASE: this.release(t); break;
    }
}
/*****
 *  States Handlers
 */
Glyph.prototype.fadeIn = function (t) {
    this.char = this.getGlyph();
    this.tweenHandler([
        { target: "alpha", t: t, b: 0, c: 1, d: 500 },
        { target: "red", t: t, b: 0, c: 255, d: 500 },
        { target: "blue", t: t, b: 0, c: 255, d: 500 }], () => {
            this.startTime = -1;
            this.state = 1;
            this.alpha = 1;
        });
}

Glyph.prototype.brighting = function (t) {

    this.char = this.getGlyph();
    this.tweenHandler([
        { target: "red", t: t, b: 255, c: -125, d: 125 },
        { target: "blue", t: t, b: 255, c: -125, d: 125 }],
        () => {
            this.startTime = -1;
            this.state = 2;
            this.red = 130;
            this.blue = 130;
        });
}

Glyph.prototype.doGreen = function (t) {
    this.tweenHandler([
        { target: "red", t: t, b: 130, c: -130, d: 500 },
        { target: "blue", t: t, b: 130, c: -130, d: 500 }],
        () => {
            this.startTime = -1;
            this.state = 3;
        });
}

Glyph.prototype.soften = function (t) {
    this.tweenHandler([
        { target: "alpha", t: t, b: 1, c: -.5, d: 750 }], () => {
            this.startTime = -1;
            this.state = 4;
        });
}

Glyph.prototype.fadeOut = function (t) {
    this.tweenHandler([{ target: "alpha", t: t, b: .5, c: -.25, d: 3000 }], () => {
        this.startTime = -1;
        this.state = 0;
    });
}
Glyph.prototype.release = function (t) {
    this.tweenHandler([{ target: "alpha", t: t, b: .25, c: -.25, d: 500 }], () => {
        this.startTime = -1;
        this.state = 0;// RELEASE
        this.frame = 0;
        this.alpha = 0;
    });
}

////
Glyph.prototype.tweenHandler = function (props, callback) {
    props.forEach((tween => {
        if (tween.t < tween.d) this[tween.target] = this.easeInOutQuad(tween.t, tween.b, tween.c, tween.d);
        else if (callback != null) callback();
    }));

}

Glyph.prototype.easeInOutQuad = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
};
