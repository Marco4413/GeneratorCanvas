/// <reference path="./animation.d.ts"/>
import { FrameGenerator, RenderingContext2D, ShapeRenderer, Font, Color } from "./animation";

interface IShape extends FrameGenerator {
    color: Color;
    outline: boolean;
    outlineWidth: number;
    hidden: boolean;

    Draw(ctx: RenderingContext2D): void;

    [Symbol.iterator](): Iterator<ShapeRenderer>;
}

export class Circle implements IShape {
    x: number;
    y: number;
    r: number;
    color: Color;

    outline: boolean;
    outlineWidth: number;

    hidden: boolean;

    constructor(x: number, y: number, r: number, color?: Color);

    Draw(ctx: RenderingContext2D): void;
    [Symbol.iterator](): Iterator<ShapeRenderer>;
}

export class Ellipse implements IShape {
    x: number;
    y: number;
    r: number;
    rx: number;
    ry: number;
    rotation: number;
    startAngle: number;
    endAngle: number;
    counterClockwise: boolean;
    color: Color;

    outline: boolean;
    outlineWidth: number;

    hidden: boolean;

    constructor(x: number, y: number, rx: number, ry?: number, color?: Color);

    SortAngles(): void;

    Draw(ctx: RenderingContext2D): void;
    [Symbol.iterator](): Iterator<ShapeRenderer>;
}

export class Rect implements IShape {
    x: number;
    y: number;
    w: number;
    h: number;
    color: Color;

    outline: boolean;
    outlineWidth: number;

    hidden: boolean;

    get x1(): number; set x1(x1: number);
    get y1(): number; set y1(y1: number);
    get x2(): number; set x2(x2: number);
    get y2(): number; set y2(y2: number);

    constructor(x: number, y: number, w: number, h: number, color?: Color);

    /** Returns a bbox where w and h are always >= 0 */
    GetBBox(): {x: number, y: number, w: number, h: number};

    Draw(ctx: RenderingContext2D): void;
    [Symbol.iterator](): Iterator<ShapeRenderer>;
}

export class Text implements IShape {
    text: string;
    x: number;
    y: number;
    color: Color;

    font: Font;

    outline: boolean;
    outlineWidth: number;

    outlineAsBorder: boolean;
    borderColor: Color;

    hidden: boolean;

    constructor(text: string, x: number, y: number, color?: Color);

    /** Reverts changes made to the context before returning. */
    Measure(ctx: RenderingContext2D): TextMetrics;

    Draw(ctx: RenderingContext2D): void;
    [Symbol.iterator](): Iterator<ShapeRenderer>;
}

export class ImageSource implements IShape {
    // HTMLImageElement|SVGImageElement|HTMLVideoElement|HTMLCanvasElement|ImageBitmap|OffscreenCanvas|VideoFrame
    source: CanvasImageSource;

    x: number;
    y: number;

    width: number;
    height: number;
    aspectRatio: number;
    
    cropLeft: number;
    cropRight: number;
    cropTop: number;
    cropBottom: number;

    /** Whether to use {@link ImageSource.color} as a placeholder while the source is loading. */
    staticPlaceholder: boolean;
    color: Color;

    /** The color of the outline is {@link ImageSource.color}. */
    outline: boolean;
    outlineWidth: number;

    hidden: boolean;

    get sourceWidth(): number;
    get sourceHeight(): number;
    get sourceAspectRatio(): number;

    get cropWidth(): number;
    get cropHeight(): number;
    
    get desiredAspectRatio(): number;
    get actualWidth(): number;
    get actualHeight(): number;

    /** True when the current frame of an Image or Video element is ready. */
    get loaded(): boolean;

    constructor(source: CanvasImageSource, x?: number, y?: number, color?: Color);

    Draw(ctx: RenderingContext2D): void;
    [Symbol.iterator](): Iterator<ShapeRenderer>;

    static FromImageUrl(url: string, x?: number, y?: number, color?: Color): ImageSource;
    static FromVideoUrl(url: string, x?: number, y?: number, color?: Color, muted?: boolean): ImageSource;
}

export class FrameView implements FrameGenerator {
    hidden: boolean;

    constructor();

    Add<T extends FrameGenerator>(shape: T): T;
    Remove(shape: FrameGenerator): boolean;

    Draw(ctx: RenderingContext2D): void;
    [Symbol.iterator](): Iterator<ShapeRenderer>;
}
