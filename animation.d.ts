/**
 * `[size, fontFamily, ...mods]`, `[size, fontFamily]` or `[size]`.
 * - `size` is in pixels.
 * - `fontFamily` defaults to 'monospace'.
 * - `...mods` specifies font-style/variant/weight/stretch
 *    following the CSS font {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font (MDN)}
 *    specification.
 */
type Font  = [number, string, ...string[]] | [number, string] | [number];
/** `[r, g, b, a]`. All components are 0-255 */
type Color = [number, number, number, number];

export function ColorToStyle(color: Color): string;
export function ColorToStyle(r: number, g: number, b: number, a?: number): string;

export function FontToStyle(font: Font): string;
export function FontToStyle(size: number, family?: string): string;

export function RGBColor(r: number, g: number, b: number, a?: number): Color;
export function HexColor(hex: string): Color;

type FontModifier = "italic"|"bold";

/**
 * @param size The size of the font in pixels
 * @param family (default: 'monospace')
 * @param mods font-style/variant/weight/stretch following the CSS font
 *             {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font (MDN)}
 *             specification.
 */
export function FontSpec(size: number, family?: string, ...mods: FontModifier[]): Font;

export function Lerp(t: number, from: number, to: number): number;

type RenderingContext2D = CanvasRenderingContext2D & OffscreenCanvasRenderingContext2D;
type AnimationContext = {
    ctx: RenderingContext2D,
    stats: {
        /** dt may be modified each frame to speed up animations */
        dt: number,

        /** The actual delta time without any speed multiplier */
        readonly realDelta: number,
        readonly avgFps: number,
        readonly minFps: number,
        readonly maxFps: number,
    },
    /** User data specific to this context. */
    data: object,
    get width(): number,
    get height(): number,
};

type ShapeRenderer = (c: RenderingContext2D) => void;

type FrameGenerator = Iterable<ShapeRenderer>;

// object is a command like STOP_ANIMATION or SKIP_UPDATE
type AnimationFrame       = object|ShapeRenderer|FrameGenerator;
type Animation            = Iterable<AnimationFrame>;
type AnimationGeneratorFn = (animContext: AnimationContext, ...args: any[]) => Generator<AnimationFrame>;

type PlayingAnimation = {
    name: string|null,
    animation: Animation,
    context: AnimationContext,

    lastFrame: OffscreenCanvasRenderingContext2D,

    preserveLastFrame: boolean,
    completed: boolean,

    onCompleted: () => void,
    onError: () => void,
};

type EasingFunction = (x: number) => number;

export function ChangeSpeed(animContext: AnimationContext, animation: Animation, speedFactor: number): Animation;
export function ApplyEase(animContext: AnimationContext, animation: Animation, duration: number, easingFunction: EasingFunction): Animation;

// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save
type CanvasContextObject = {
    transform: DOMMatrix,
    lineDash:  number[],
    strokeStyle:              string|CanvasGradient|CanvasPattern,
    fillStyle:                string|CanvasGradient|CanvasPattern,
    globalAlpha:              number,
    lineWidth:                number,
    lineCap:                  CanvasLineCap,
    lineJoin:                 CanvasLineJoin,
    miterLimit:               number,
    lineDashOffset:           number,
    shadowOffsetX:            number,
    shadowOffsetY:            number,
    shadowBlur:               number,
    shadowColor:              string,
    globalCompositeOperation: GlobalCompositeOperation,
    font:                     string,
    textAlign:                CanvasTextAlign,
    textBaseline:             CanvasTextBaseline,
    direction:                CanvasDirection,
    imageSmoothingEnabled:    boolean,
};

/** Does not support clipping regions. */
export function SaveCanvasContextObject(ctx: RenderingContext2D): CanvasContextObject;
export function RestoreCanvasContextObject(ctx: RenderingContext2D, obj: CanvasContextObject): void;

/**
 * Plays multiple animations at the same time. {@link AnimationContext.data} is shared between all animations.
 * 
 * Animations played with this function MUST NOT use properties from {@link RenderingContext2D} not supported by {@link SaveCanvasContextObject}.
 * 
 * The last frame of each animation is preserved until all animations are complete.
 * This function DOES NOT generate a new Canvas for each animation (unlike {@link AnimationPlayer}).
 * It reuses each value generated by the animation to regen the frame.
 */
export function AnimationGroup(animContext: AnimationContext, ...animations: Animation[]): Animation;

// https://easings.net
export const Ease: {
    Linear: EasingFunction,
    InSine: EasingFunction,
    OutSine: EasingFunction,
    InOutSine: EasingFunction,
    InQuad: EasingFunction,
    OutQuad: EasingFunction,
    InOutQuad: EasingFunction,
    InCubic: EasingFunction,
    OutCubic: EasingFunction,
    InOutCubic: EasingFunction,
    InCirc: EasingFunction,
    OutCirc: EasingFunction,
    InOutCirc: EasingFunction,
    // The following easing functions may *go back in time*.
    // Which means that some animations might break if used in ApplyEase.
    InBack: EasingFunction,
    OutBack: EasingFunction,
    InOutBack: EasingFunction,
    InElastic: EasingFunction,
    OutElastic: EasingFunction,
    InOutElastic: EasingFunction,
};

export function ShapeCircle(x: number, y: number, r: number): ShapeRenderer;
export function ShapeEllipse(x: number, y: number, rx: number, ry: number, rotation?: number, startAngle?: number, endAngle?: number, counterClockwise?: boolean): ShapeRenderer;
export function ShapeStrokeEllipse(x: number, y: number, rx: number, ry: number, rotation?: number, startAngle?: number, endAngle?: number, counterClockwise?: boolean): ShapeRenderer;
export function ShapeText(text: string, x: number, y: number): ShapeRenderer;
export function ShapeRect(x: number, y: number, w: number, h: number): ShapeRenderer;

/** Returns an animation which does not change the frame and waits ms time. */
export function Pause(ms?: number): Animation;
/** Stops the current animation. */
export function Stop(): object;
/** Skips this frame keeping what was drawn on the last frame. */
export function Skip(): object;
/** Generates an empty frame. */
export function Clear(): object;

/** Stops the currently playing animation. */
export const STOP_ANIMATION: object;
/** Skips the next frame and prevents deltaTime updates. Used for Pause. */
export const SKIP_UPDATE: object;
export const EMPTY_FRAME: object;

/** A collection of debugging animations. */
export const Debug: {
    FrameRate: (animContext: AnimationContext, font?: Font, color?: Color, margin?: number, updateTime?: number, loopRef?: [boolean]) => Generator<AnimationFrame>
};

export class AnimationPlayer<CanvasType extends HTMLCanvasElement|OffscreenCanvas> {
    /**
     * Logger used by the class for debugging (default: {@link console.debug}).
     * Set this to `() => undefined` to disable all logging.
     */
    static log: (...data: any[]) => void;

    constructor(canvas: CanvasType);

    get canvas(): CanvasType;
    get playing(): boolean;

    get animations(): number;
    get playingAnimations(): number;

    get deltaSamples(): number;
    set deltaSamples(count: number);

    /**
     * @param animation The Generator function which generates the animation.
     * @param animationArgs Extra arguments to pass to the generator function.
     * @param preserveLastFrame Whether the last frame of the animation should stay on screen or not.
     * @param autoStart If false, {@link AnimationPlayer.Start} must be called for the animation to start playing.
     * @param name The name of the animation used for logging.
     * @returns A promise which resolves when the animation is complete (may reject on error).
     */
    Play(animation: AnimationGeneratorFn, animationArgs?: any[], preserveLastFrame?: boolean, autoStart?: boolean, name?: string|null): Promise<void>;
    
    /** Starts playing animations. By default {@link AnimationPlayer.Play} automatically calls this method. */
    Start(): void;
    /** Pauses all currently playing animations. Preserves the state to allow for {@link AnimationPlayer.Start} to be called again. */
    Pause(): void;
    /** Stops and resets the canvas. */
    Stop(): void;

    /** Resize the canvas preserving the currently displayed image. */
    Resize(width: number, height: number, alignX?: number, alignY?: number): void;
    ResizeRaw(width: number, height: number): void;
}