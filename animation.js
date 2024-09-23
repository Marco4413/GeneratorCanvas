/// <reference path="./animation.d.ts"/>

/*
Copyright (c) 2024 [Marco4413](https://github.com/Marco4413/GeneratorCanvas)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

export function ColorToStyle(r, g, b, a) {
    if (Array.isArray(r))
        [r, g, b, a] = r;

    a = a ?? 0xFF;
    const higherS = ((b << 8) | a).toString(16).padStart(4, "0");
    const lowerS  = ((r << 8) | g).toString(16).padStart(4, "0");
    return `#${lowerS}${higherS}`;
}

export function FontToStyle(size, family, ...mods) {
    if (Array.isArray(size))
        [size, family, ...mods] = size;

    mods = mods.length > 0 ? `${mods.join(" ")} ` : "";
    if (family) return `${mods}${size}px '${family.replace("'", "\\'")}'`;
    return `${mods}${size}px monospace`;
}

export function RGBColor(r, g, b, a=255) {
    return [r, g, b, a];
}

export function HexColor(hex) {
    if (hex[0] !== "#")
        throw new TypeError("Hex color must start with '#'");
    const color = [0,0,0,255];
    switch (hex.length) {
    case 5: // #rgba
        color[3] = Number.parseInt(hex[4]+hex[4], 16);
    case 4: // #rgb
        color[2] = Number.parseInt(hex[3]+hex[3], 16);
        color[1] = Number.parseInt(hex[2]+hex[2], 16);
        color[0] = Number.parseInt(hex[1]+hex[1], 16);
        break;
    case 9: // #rrggbbaa
        color[3] = Number.parseInt(hex[7]+hex[8], 16);
    case 7: // #rrggbb
        color[2] = Number.parseInt(hex[5]+hex[6], 16);
        color[1] = Number.parseInt(hex[3]+hex[4], 16);
        color[0] = Number.parseInt(hex[1]+hex[2], 16);
        break;
    default:
        throw new TypeError("Hex color must be one of '#rgb', '#rgba', '#rrggbb' or '#rrggbbaa'");
    }
    return color;
}

export function FontSpec(size, family="monospace", ...mods) {
    return [size, family, ...mods];
}

export function Lerp(t, from, to) {
    return from + t * (to - from);
}

export function ChangeSpeed(animContext, animationIterable, speedFactor) {
    if (animationIterable[Symbol.iterator] != null) {
        const animation = animationIterable[Symbol.iterator]();
        return (function*() {
            while (true) {
                animContext.stats.dt *= speedFactor;
                const frame = animation.next();
                if (frame.done) break;
                yield frame.value;
            }
        })();
    } else {
        throw new TypeError("Expected iterable.");
    }
}

export function ApplyEase(animContext, animationIterable, duration, easingFunction) {
    if (animationIterable[Symbol.iterator] != null) {
        const animation = animationIterable[Symbol.iterator]();
        return (function*() {
            let animTime = 0;
            let lastEasedTime = 0;
            while (true) {
                const easedTime = easingFunction(Math.min(1, animTime/duration)) * duration;
                const easedDeltaTime = easedTime - lastEasedTime;
                lastEasedTime = easedTime;

                animTime += animContext.stats.dt;
                if (animTime <= duration)
                    animContext.stats.dt = easedDeltaTime;

                const frame = animation.next();
                if (frame.done) break;
                yield frame.value;
            }
        })();
    } else {
        throw new TypeError("Expected iterable.");
    }
}

/**
 * @param {CanvasRenderingContext2D & OffscreenCanvasRenderingContext2D} ctx
 * @returns {object}
 */
export function SaveCanvasContextObject(ctx) {
    // Based on https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save
    return {
        transform: ctx.getTransform(),
        lineDash:  ctx.getLineDash(),

        strokeStyle:              ctx.strokeStyle,
        fillStyle:                ctx.fillStyle,
        globalAlpha:              ctx.globalAlpha,
        lineWidth:                ctx.lineWidth,
        lineCap:                  ctx.lineCap,
        lineJoin:                 ctx.lineJoin,
        miterLimit:               ctx.miterLimit,
        lineDashOffset:           ctx.lineDashOffset,
        shadowOffsetX:            ctx.shadowOffsetX,
        shadowOffsetY:            ctx.shadowOffsetY,
        shadowBlur:               ctx.shadowBlur,
        shadowColor:              ctx.shadowColor,
        globalCompositeOperation: ctx.globalCompositeOperation,
        font:                     ctx.font,
        textAlign:                ctx.textAlign,
        textBaseline:             ctx.textBaseline,
        direction:                ctx.direction,
        imageSmoothingEnabled:    ctx.imageSmoothingEnabled,
    }
}

export function RestoreCanvasContextObject(ctx, obj) {
    ctx.setTransform(obj.transform);
    ctx.setLineDash(obj.lineDash);
    ctx.strokeStyle              = obj.strokeStyle;
    ctx.fillStyle                = obj.fillStyle;
    ctx.globalAlpha              = obj.globalAlpha;
    ctx.lineWidth                = obj.lineWidth;
    ctx.lineCap                  = obj.lineCap;
    ctx.lineJoin                 = obj.lineJoin;
    ctx.miterLimit               = obj.miterLimit;
    ctx.lineDashOffset           = obj.lineDashOffset;
    ctx.shadowOffsetX            = obj.shadowOffsetX;
    ctx.shadowOffsetY            = obj.shadowOffsetY;
    ctx.shadowBlur               = obj.shadowBlur;
    ctx.shadowColor              = obj.shadowColor;
    ctx.globalCompositeOperation = obj.globalCompositeOperation;
    ctx.font                     = obj.font;
    ctx.textAlign                = obj.textAlign;
    ctx.textBaseline             = obj.textBaseline;
    ctx.direction                = obj.direction;
    ctx.imageSmoothingEnabled    = obj.imageSmoothingEnabled;
}

/** Instances of this class are not meant to be shared. */
export class _BufferedIterable {
    /** @type {Iterator<any>} */ #iterator;
    /** @type {any[]} */ #storage;

    constructor(iterable) {
        this.#iterator = iterable[Symbol.iterator]();
        this.#storage = [];
    }

    *[Symbol.iterator]() {
        if (this.#iterator) {
            const iterator = this.#iterator;
            this.#iterator = null;

            for (const v of iterator) {
                this.#storage.push(v);
                yield v;
            }
        } else {
            yield* this.#storage;
        }
    }
}

export function AnimationGroup(c, ...animationsIterables) {
    const DEFAULT_CONTEXT_OBJ = Object.freeze(SaveCanvasContextObject(c.ctx));
    const animations = animationsIterables.map(iterable => {
        if (!iterable[Symbol.iterator])
            throw new TypeError("Expected iterable.");
        const anim = iterable[Symbol.iterator]();
        return { it: anim, ctx: DEFAULT_CONTEXT_OBJ, lastFrame: [], isDone: false };
    });
    return (function*() {
        while (true) {
            let isDone = true;
            const dt = c.stats.dt;
            for (const anim of animations) {
                if (anim.isDone)
                    continue;
    
                c.stats.dt = dt;
                const nextFrameIt = anim.it.next();
                const newContext = SaveCanvasContextObject(c.ctx);
                RestoreCanvasContextObject(c.ctx, DEFAULT_CONTEXT_OBJ);
    
                if (nextFrameIt.done) {
                    anim.isDone = true;
                    continue;
                }
    
                isDone = false;
    
                if (nextFrameIt.value[Symbol.asyncIterator]) {
                    throw new TypeError("Async iterators for iterable frames are not supported");
                } else if (nextFrameIt.value[Symbol.iterator]) {
                    anim.ctx = newContext;
                    anim.lastFrame = new _BufferedIterable(nextFrameIt.value);
                } else {
                    switch (nextFrameIt.value) {
                    case STOP_ANIMATION:
                        anim.isDone = true;
                        break;
                    case SKIP_UPDATE:
                        break;
                    case EMPTY_FRAME:
                        anim.lastFrame = [];
                        break;
                    default:
                        anim.ctx = newContext;
                        anim.lastFrame = [nextFrameIt.value];
                    }
                }
            }

            yield (function*() {
                for (const anim of animations) {
                    yield ctx => RestoreCanvasContextObject(ctx, anim.ctx);
                    yield* anim.lastFrame;
                }
            })();

            if (isDone) break;
        }
    })();
}

// https://easings.net
export const Ease = Object.freeze({
    Linear:     x => x,
    InSine:     x => (1 - Math.cos((x * Math.PI) / 2)),
    OutSine:    x => Math.sin((x * Math.PI) / 2),
    InOutSine:  x => (-(Math.cos(Math.PI * x) - 1) / 2),
    InQuad:     x => (x*x),
    OutQuad:    x => (1 - (1 - x) * (1 - x)),
    InOutQuad:  x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    InCubic:    x => (x*x*x),
    OutCubic:   x => (1 - Math.pow(1 - x, 3)),
    InOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    InCirc:     x => (1 - Math.sqrt(1 - Math.pow(x, 2))),
    OutCirc:    x => Math.sqrt(1 - Math.pow(x - 1, 2)),
    InOutCirc:  x => (x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2),
    InBack:     x => (2.70158 * x * x * x - 1.70158 * x * x),
    OutBack:    x => (1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2)),
    InOutBack:  x => (x < 0.5
        ? (Math.pow(2 * x, 2) * (4.22658 * 2 * x - 3.22658)) / 2
        : (Math.pow(2 * x - 2, 2) * (4.22658 * (x * 2 - 2) + 3.22658) + 2) / 2),
    InElastic:    x => (x <= 0 ? 0 : x >= 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * (2 * Math.PI) / 3)),
    OutElastic:   x => (Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
    InOutElastic: x => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5
        ? (-(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * ((2 * Math.PI) / 4.5))) / 2)
        : ((Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * ((2 * Math.PI) / 4.5))) / 2 + 1)),
});

export function ShapeCircle(x, y, r) {
    return ShapeEllipse(x, y, r, r);
}

export function ShapeEllipse(x, y, rx, ry, rotation=0, startAngle=0, endAngle=2*Math.PI, counterClockwise=false) {
    return ctx => {
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, rotation, startAngle, endAngle, counterClockwise);
        ctx.fill();
    };
}

export function ShapeStrokeEllipse(x, y, rx, ry, rotation=0, startAngle=0, endAngle=2*Math.PI, counterClockwise=false) {
    return ctx => {
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, rotation, startAngle, endAngle, counterClockwise);
        ctx.stroke();
    };
}

export function ShapeText(text, x, y) {
    return ctx => {
        ctx.fillText(text, x, y);
    };
}

export function ShapeRect(x, y, w, h) {
    return ctx => {
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
    };
}

export const STOP_ANIMATION = Object.freeze({$stopAnimation: true});
export const SKIP_UPDATE    = Object.freeze({$skipUpdate: true});
export const EMPTY_FRAME    = Object.freeze({$emptyFrame: true});

export function* Pause(ms) {
    if (ms) {
        const startTime = performance.now();
        while (performance.now() - startTime < ms) {
            yield SKIP_UPDATE;
        }
    } else {
        yield SKIP_UPDATE;
    }
}

export function Stop() {
    return STOP_ANIMATION;
}

export function Skip() {
    return SKIP_UPDATE;
}

export function Clear() {
    return EMPTY_FRAME;
}

export const Debug = Object.freeze({
    *FrameRate(c, font=FontSpec(24, "monospace"), color=HexColor("#e6e2e1"), margin=50, updateTime=250, loopRef=[true]) {
        while (loopRef[0]) {
            c.ctx.font = FontToStyle(font);
            c.ctx.fillStyle = ColorToStyle(color);
            yield ShapeText(
                `${Math.floor(c.stats.avgFps)} | ${Math.floor(c.stats.minFps)} | ${Math.floor(c.stats.maxFps)} FPS`,
                margin, c.height-margin);
            yield* Pause(updateTime);
        }
    }
});

export class AnimationPlayer {
    static log = console.debug;

    /** @type {HTMLCanvasElement|OffscreenCanvas} */
    #canvas;
    /** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} */
    #context;

    /** @type {import("./animation").PlayingAnimation[]} */
    #animations;

    #playing;

    #pause;
    #lastFrame;

    #deltaTimeAcc;
    #deltaTimeAccCount;

    constructor(canvas) {
        this.#canvas = canvas;
        this.#context = canvas.getContext("2d");

        this.#animations = [];
        this.#playing = false;
        this.#pause   = true;
        this.#lastFrame = performance.now();

        this.#deltaTimeAcc = [];
        this.#deltaTimeAccCount = 10;
    }

    get canvas() { return this.#canvas; }

    get playing() { return this.#playing; }

    get animations() { return this.#animations.length; }
    get playingAnimations() {
        let count = 0;
        for (const anim of this.#animations) {
            if (!anim.completed) ++count;
        }
        return count;
    }

    get deltaSamples() { return this.#deltaTimeAccCount; }
    set deltaSamples(count) { this.#deltaTimeAccCount = Math.max(1, count); }

    #NextFrame() {
        if (this.#pause) {
            this.#playing = false;
            AnimationPlayer.log("AnimationPlayer.#NextFrame: Pause player (user requested).");
            return;
        } else if (!this.#playing) {
            AnimationPlayer.log("AnimationPlayer.#NextFrame: Start player.");
            this.#playing = true;
            this.#lastFrame = performance.now();
            this.#deltaTimeAcc = [];
            requestAnimationFrame(() => this.#NextFrame());
            return;
        }
        
        const frameNow = performance.now();
        const dt = (frameNow-this.#lastFrame)*1e-3;
        this.#lastFrame = frameNow;

        if (this.Update(dt)) {
            requestAnimationFrame(() => this.#NextFrame());
        } else {
            AnimationPlayer.log("AnimationPlayer.#NextFrame: Pause player (all animations completed).");
            this.#pause = true;
            this.#playing = false;
        }
    }

    Update(dt) {
        this.#deltaTimeAcc.push(dt);
        if (this.#deltaTimeAcc.length > this.#deltaTimeAccCount)
            this.#deltaTimeAcc.splice(0, this.#deltaTimeAcc.length-this.#deltaTimeAccCount);

        let avgFps = Number.NaN;
        let minFps = Number.NaN;
        let maxFps = Number.NaN;
        { // FPS
            let avgDelta = 0;
            let minDelta = Number.POSITIVE_INFINITY;
            let maxDelta = Number.NEGATIVE_INFINITY;
            for (const dt of this.#deltaTimeAcc) {
                avgDelta += dt;
                if (dt > 0 && dt < minDelta) minDelta = dt;
                if (dt > 0 && dt > maxDelta) maxDelta = dt;
            }
            avgDelta /= this.#deltaTimeAcc.length;
            avgFps = 1 / avgDelta;
            minFps = 1 / maxDelta;
            maxFps = 1 / minDelta;
        }

        let needsUpdating = false;
        for (let animI = 0; animI < this.#animations.length; animI++) {
            const pAnimation = this.#animations[animI];
            if (pAnimation.completed) {
                if (!pAnimation.preserveLastFrame)
                    this.#animations.splice(animI--, 1);
                continue;
            }

            needsUpdating = true;
            pAnimation.context.stats.dt = dt;

            pAnimation.context.stats.realDelta = dt;
            pAnimation.context.stats.avgFps = avgFps;
            pAnimation.context.stats.minFps = minFps;
            pAnimation.context.stats.maxFps = maxFps;

            try {
                const width = this.#canvas.width;
                const height = this.#canvas.height;

                if (pAnimation.context.ctx.canvas.width !== width)
                    pAnimation.context.ctx.canvas.width = width;
                if (pAnimation.context.ctx.canvas.height !== height)
                    pAnimation.context.ctx.canvas.height = height;
                pAnimation.context.ctx.reset();

                const it = pAnimation.animation.next();
                if (it.done) {
                    pAnimation.completed = true;
                    pAnimation.onCompleted();
                    continue;
                }

                let updateLastFrame = true;
                const frame = it.value;
                if (frame[Symbol.asyncIterator]) {
                    throw new TypeError("Async iterators for iterable frames are not supported.");
                } else if (frame[Symbol.iterator]) {
                    for (const shape of frame)
                        shape(pAnimation.context.ctx);
                } else {
                    switch (frame) {
                    case STOP_ANIMATION:
                        updateLastFrame = false;
                        pAnimation.completed = true;
                        pAnimation.onCompleted();
                        break;
                    case SKIP_UPDATE:
                        updateLastFrame = false;
                        break;
                    case EMPTY_FRAME:
                        break;
                    default:
                        frame(pAnimation.context.ctx);
                    }
                }

                if (updateLastFrame) {
                    if (pAnimation.lastFrame.canvas.width !== width)
                        pAnimation.lastFrame.canvas.width = width;
                    if (pAnimation.lastFrame.canvas.height !== height)
                        pAnimation.lastFrame.canvas.height = height;
                    pAnimation.lastFrame.clearRect(0, 0, width, height);
                    pAnimation.lastFrame.drawImage(pAnimation.context.ctx.canvas, 0, 0);
                }
            } catch (error) {
                const animationName = pAnimation.name ?? `${animI}`;
                console.error(`Animation '${animationName}' has thrown an error:\n`, error);

                pAnimation.completed = true;
                this.#animations.splice(animI--, 1);
                pAnimation.onError(error);
            }
        }

        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        for (const anim of this.#animations)
            this.#context.drawImage(anim.lastFrame.canvas, 0, 0);

        return needsUpdating;
    }

    Play(animation, animationArgs=[], preserveLastFrame=true, autoStart=true, name=null) {
        return new Promise((res, rej) => {
            const animContext = Object.defineProperties({
                ctx: new OffscreenCanvas(this.#canvas.width, this.#canvas.height).getContext("2d"),
                stats: {
                    dt: 0.016,
                    realDeltaTime: 0.016,
                    fps: Number.NaN,
                    minFps: Number.POSITIVE_INFINITY,
                    maxFps: Number.NEGATIVE_INFINITY,
                },
                data: {},
            }, {
                width:  { get: function() { return this.ctx.canvas.width;  } },
                height: { get: function() { return this.ctx.canvas.height; } },
            });
    
            /** @type {import("./animation").AnyAnimation} */
            const animGenerator = animation(animContext, ...animationArgs);

            if (!name) {
                const fnName = animation.name;
                if (fnName.length > 0) name = fnName;
            }

            this.#animations.push({
                name,
                animation: animGenerator,
                context: animContext,

                lastFrame: new OffscreenCanvas(this.#canvas.width, this.#canvas.height).getContext("2d"),

                preserveLastFrame,
                shouldUpdate: true,
                completed: false,

                onCompleted: res,
                onError: rej,
            });
    
            if (autoStart) this.Start();
        });
    }

    Start() {
        this.#pause = false;
        if (!this.#playing)
            this.#NextFrame();
    }
    
    Pause() {
        this.#pause = true;
    }

    Stop() {
        this.Pause();
        for (const animation of this.#animations) {
            if (!animation.completed) {
                animation.completed = true;
                animation.onCompleted();
            }
        }
        this.#context.reset();
        this.#animations = [];
    }

    Resize(width, height, alignX=0, alignY) {
        alignY = alignY ?? alignX;

        this.ResizeRaw(width, height);
        for (const anim of this.#animations) {
            this.#context.drawImage(anim.lastFrame.canvas,
                (width - anim.lastFrame.canvas.width) * alignX,
                (height - anim.lastFrame.canvas.height) * alignY);
        }
    }

    ResizeRaw(width, height) {
        this.#canvas.width = width;
        this.#canvas.height = height;
    }
}
