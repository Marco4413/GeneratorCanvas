/// <reference path="./frame.d.ts"/>

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

import { ColorToStyle, FontToStyle, HexColor } from "./animation.js";

const DEFAULT_NONE_COLOR = Object.freeze(HexColor("#a0a"));

export class Circle {
    constructor(x, y, r, color) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.color = color ?? DEFAULT_NONE_COLOR.slice();

        this.outline = false;
        this.outlineWidth = 10;

        this.hidden = false;
    }

    Draw(ctx) {
        if (this.hidden) return;

        if (this.outline) {
            ctx.strokeStyle = ColorToStyle(this.color);
            ctx.lineWidth = this.outlineWidth;
        } else ctx.fillStyle = ColorToStyle(this.color);

        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.r, this.r, 0, 0, 2*Math.PI);

        if (this.outline)
            ctx.stroke();
        else ctx.fill();
    }

    *[Symbol.iterator]() {
        if (!this.hidden)
            yield ctx => this.Draw(ctx);
    }
}

export class Ellipse {
    constructor(x, y, rx, ry, color) {
        this.x = x;
        this.y = y;
        this.rx = rx;
        this.ry = ry ?? rx;
        this.rotation   = 0;
        this.startAngle = 0;
        this.endAngle   = 2*Math.PI;
        this.counterClockwise = false;
        this.color = color ?? DEFAULT_NONE_COLOR.slice();

        this.outline = false;
        this.outlineWidth = 10;

        this.hidden = false;
    }

    set r(val) {
        this.rx = val;
        this.ry = val;
    }

    get r() {
        return this.rx !== this.ry
            ? (this.rx + this.ry)/2
            : this.rx;
    }

    SortAngles() {
        const s = this.startAngle;
        const e = this.endAngle;
        this.startAngle = Math.min(s, e);
        this.endAngle   = Math.max(s, e);
    }

    Draw(ctx) {
        if (this.hidden) return;

        if (this.outline) {
            ctx.strokeStyle = ColorToStyle(this.color);
            ctx.lineWidth = this.outlineWidth;
        } else ctx.fillStyle = ColorToStyle(this.color);

        ctx.beginPath();
        ctx.ellipse(
            this.x, this.y,
            this.rx, this.ry,
            this.rotation,
            this.startAngle, this.endAngle,
            this.counterClockwise);

        if (this.outline)
            ctx.stroke();
        else ctx.fill();
    }

    *[Symbol.iterator]() {
        if (!this.hidden)
            yield ctx => this.Draw(ctx);
    }
}

export class Rect {
    constructor(x, y, w, h, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color ?? DEFAULT_NONE_COLOR.slice();

        this.outline = false;
        this.outlineWidth = 10;

        this.hidden = false;
    }

    get x1() { return this.x; }
    get y1() { return this.y; }

    set x1(x1) {
        const x2 = this.x2;
        this.x = x1;
        this.w = x2-x1;
    }

    set y1(y1) {
        const y2 = this.y2;
        this.y = y1;
        this.h = y2-y1;
    }

    get x2() { return this.x+this.w; }
    get y2() { return this.y+this.h; }

    set x2(x2) {
        const x1 = this.x1;
        this.w = x2-x1;
    }

    set y2(y2) {
        const y1 = this.y1;
        this.h = y2-y1;
    }

    GetBBox() {
        return {
            x: this.w >= 0 ? this.x : this.x+this.w,
            y: this.h >= 0 ? this.y : this.y+this.h,
            w: Math.abs(this.w),
            h: Math.abs(this.h),
        }
    }

    Draw(ctx) {
        if (this.hidden) return;

        if (this.outline) {
            ctx.strokeStyle = ColorToStyle(this.color);
            ctx.lineWidth = this.outlineWidth;
        } else ctx.fillStyle = ColorToStyle(this.color);

        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        // const bbox = this.GetBBox();
        // ctx.rect(bbox.x, bbox.y, bbox.w, bbox.h);

        if (this.outline)
            ctx.stroke();
        else ctx.fill();
    }

    *[Symbol.iterator]() {
        if (!this.hidden)
            yield ctx => this.Draw(ctx);
    }
}

export class Text {
    constructor(text, x, y, color) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color ?? DEFAULT_NONE_COLOR.slice();

        this.font = [12, "JetBrains Mono"];

        this.outline = false;
        this.outlineWidth = 10;

        this.outlineAsBorder = false;
        this.borderColor = DEFAULT_NONE_COLOR.slice();

        this.hidden = false;
    }

    Measure(ctx) {
        const _font = ctx.font;
        ctx.font = FontToStyle(this.font);
        const metrics = ctx.measureText(this.text);
        ctx.font = _font;
        return metrics;
    }

    Draw(ctx) {
        if (this.hidden) return;

        if (this.outline) {
            if (!this.outlineAsBorder) {
                ctx.strokeStyle = ColorToStyle(this.color);
            } else {
                ctx.fillStyle = ColorToStyle(this.color);
                ctx.strokeStyle = ColorToStyle(this.borderColor);
            }
            ctx.lineWidth = this.outlineWidth;
        } else ctx.fillStyle = ColorToStyle(this.color);

        ctx.font = FontToStyle(this.font);

        if (this.outline) {
            if (this.outlineAsBorder)
                ctx.fillText(this.text, this.x, this.y);
            ctx.strokeText(this.text, this.x, this.y);
        } else ctx.fillText(this.text, this.x, this.y);
    }

    *[Symbol.iterator]() {
        if (!this.hidden)
            yield ctx => this.Draw(ctx);
    }
}

export class ImageSource {
    constructor(source, x=0, y=0, color) {
        this.source = source;

        this.x = x;
        this.y = y;
        this.width  = -1;
        this.height = -1;
        this.aspectRatio = -1;

        this.cropLeft   = 0;
        this.cropRight  = 0;
        this.cropTop    = 0;
        this.cropBottom = 0;

        this.staticPlaceholder = color != null;
        this.color = color ?? DEFAULT_NONE_COLOR.slice();

        this.outline = false;
        this.outlineWidth = 2.5;

        this.hidden = false;
    }

    get sourceWidth() {
        return this.source.videoWidth ?? this.source.naturalWidth ?? this.source.width;
    }

    get sourceHeight() {
        return this.source.videoHeight ?? this.source.naturalHeight ?? this.source.height;
    }

    get sourceAspectRatio() {
        return this.sourceWidth / this.sourceHeight;
    }

    get cropWidth() {
        const w = this.cropLeft + this.cropRight;
        return w <= this.sourceWidth ? w : this.sourceWidth;
    }

    get cropHeight() {
        const h = this.cropTop + this.cropBottom;
        return h <= this.sourceHeight ? h : this.sourceHeight;
    }

    get desiredAspectRatio() {
        return this.aspectRatio >= 0 ? this.aspectRatio : this.sourceAspectRatio;
    }

    get actualWidth() {
        if (this.width < 0) {
            if (this.height >= 0) {
                const aspectRatio = this.desiredAspectRatio;
                if (Number.isNaN(aspectRatio)) return 0;
                return aspectRatio * this.height;
            }
            return this.sourceWidth - this.cropWidth;
        }
        return this.width;
    }

    get actualHeight() {
        if (this.height < 0) {
            if (this.width >= 0) {
                const aspectRatio = this.desiredAspectRatio;
                if (Number.isNaN(aspectRatio) || aspectRatio === 0)
                    return 0;
                return this.width / aspectRatio;
            }
            return this.sourceHeight - this.cropHeight;
        }
        return this.height;
    }

    get loaded() {
        return !this.source.nodeName
            || (this.source.nodeName !== "VIDEO" && this.source.nodeName !== "IMG")
            || this.source.complete
            || this.source.readyState === HTMLMediaElement.HAVE_CURRENT_DATA
            || this.source.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA;
    }

    /** @param {import("./animation.js").RenderingContext2D} ctx */
    Draw(ctx) {
        if (this.hidden) return;

        const sX = this.cropLeft;
        const sY = this.cropTop;
        const sW = this.sourceWidth  - this.cropWidth;
        const sH = this.sourceHeight - this.cropHeight;

        const dX = this.x;
        const dY = this.y;
        const dW = this.actualWidth; // this.width  < 0 ? sW : this.width;
        const dH = this.actualHeight; // this.height < 0 ? sH : this.height;

        if (this.staticPlaceholder && !this.loaded) {
            ctx.fillStyle = ColorToStyle(this.color);
            ctx.beginPath();
            ctx.rect(dX, dY, dW, dH);
            ctx.fill();
        }

        if (this.outline) {
            ctx.strokeStyle = ColorToStyle(this.color);
            ctx.lineWidth = this.outlineWidth;
            const halfOutline = this.outlineWidth/2;
            ctx.strokeRect(
                dX-halfOutline, dY-halfOutline,
                dW+this.outlineWidth, dH+this.outlineWidth);
        }

        ctx.drawImage(this.source, sX, sY, sW, sH, dX, dY, dW, dH);
    }

    *[Symbol.iterator]() {
        if (!this.hidden)
            yield ctx => this.Draw(ctx);
    }

    static FromImageUrl(url, x, y, color) {
        const img = document.createElement("img");
        img.src = url;
        return new ImageSource(img, x, y, color)
    }

    static FromVideoUrl(url, x, y, color, muted=true) {
        const vid = document.createElement("video");
        vid.src = url;
        vid.controls = false;
        vid.loop = true;
        vid.muted = muted;
        vid.play();
        return new ImageSource(vid, x, y, color)
    }
}

export class FrameView {
    #view;

    constructor() {
        this.#view = [];
        this.hidden = false;
    }

    Add(shape) {
        this.#view.push(shape);
        return shape;
    }

    Remove(shape) {
        const idx = this.#view.indexOf(shape);
        if (idx < 0) return false;
        this.#view.splice(idx, 1);
        return true;
    }

    *[Symbol.iterator]() {
        if (!this.hidden) {
            for (const shape of this.#view)
                yield* shape;
        }
    }
}
