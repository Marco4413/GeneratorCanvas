import * as a from "../animation.js";
import * as f from "../frame.js";

window.addEventListener("load", async () => {
    const canvas = document.getElementById("animation");
    /** @type {a.AnimationPlayer<HTMLCanvasElement>} */
    const player = new a.AnimationPlayer(canvas);

    player.Resize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.Resize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("keypress", () => {
        player.Stop();
    });

    // We want to play AnimationLoading before AnimationText to draw it below the text.
    // Moreover, the Loading animation should end after the Text animation.
    // So we provide a promise which plays the text animation on the next frame of the event loop and awaits it.
    await player.Play(AnimationLoading, [(async () => {
        await AsyncWait();
        await player.Play(AnimationText);
    })()], false, false);

    canvas.style.display = "none";
});

function AsyncWait(ms) {
    return new Promise(res => setTimeout(res, ms));
}

/** @param {a.AnimationContext} c */
function* AnimationText(c) {
    const animDuration = 7;
    const blinks = animDuration;

    const textFont = [50, "JetBrains Mono"];
    const fullText = "Welcome!";
    const cursorHeight = textFont[0]-10;

    const view = new f.FrameView();

    const txt = view.Add(new f.Text("", 0, 0, a.HexColor("#e6e2e1")));
    txt.font = textFont;

    const cur = view.Add(new f.Rect(2.5, -cursorHeight/2, 5, cursorHeight, a.HexColor("#e6e2e1")));

    let animProgress = 0;
    while (animProgress < 1) {
        c.ctx.translate(c.width/2+30, c.height/2);

        animProgress = Math.min(1, animProgress + c.stats.dt / animDuration);
        const animEasedProgress = a.Ease.OutCubic(a.Ease.InOutCubic(animProgress));

        cur.hidden = Math.round(2*blinks * animProgress) % 2 === 0;
        const textI = Math.round(fullText.length * animEasedProgress);

        txt.text = fullText.substring(0, textI);
        const textMeasure = txt.Measure(c.ctx);

        cur.y = txt.y-textMeasure.actualBoundingBoxAscent/2 - cursorHeight/2;

        txt.x = -textMeasure.width;
        txt.y = textMeasure.actualBoundingBoxAscent/2;

        yield view;
    }
}

/**
 * @param {a.AnimationContext} c
 * @param {Promise<any>} worker
 */
function* AnimationLoading(c, worker) {
    const fadeInDuration = .5;
    const animDuration = 5;
    const fadeOutDuration = .5;

    const minAngle = Math.PI/6;
    const rotationOffset = -minAngle/2 - Math.PI/2;

    const view = new f.FrameView();
    const e = view.Add(new f.Ellipse(0, 0, 50, undefined, a.HexColor("#38404c")));
    e.outline = true;
    e.outlineWidth = 10;

    let completed = false;
    if (worker) worker.then(() => { completed = true; })

    {
        let animProgress = 0;
        while (animProgress < 1) {
            c.ctx.translate(c.width/2, c.height/2);

            animProgress = Math.min(1, animProgress + c.stats.dt / fadeInDuration);
            const animEasedProgress = (1.0 - a.Ease.InCubic(animProgress));

            e.rotation   = rotationOffset + (2*Math.PI + minAngle);
            e.startAngle = 2*Math.PI - minAngle + (minAngle*animEasedProgress*0.5);
            e.endAngle   = 2*Math.PI - (minAngle*animEasedProgress*0.5);
            e.SortAngles();
            yield view;
        }
    }

    e.rotation   = rotationOffset;
    e.startAngle = 0;
    e.endAngle   = minAngle;

    do {
        let animProgress = 0;
        while (animProgress < 1 && !completed) {
            c.ctx.translate(c.width/2, c.height/2);

            animProgress = Math.min(1, animProgress + c.stats.dt / animDuration);
            const animEasedProgress = a.Ease.InOutElastic(animProgress);

            e.rotation = rotationOffset + animEasedProgress * (2*Math.PI + minAngle);
            if (animEasedProgress < 0.5) {
                e.startAngle = 0;
                e.endAngle   = minAngle + (animEasedProgress*2)*(2*Math.PI - minAngle);
                e.SortAngles();
                yield view;
            } else {
                e.startAngle = ((animEasedProgress-0.5)*2)*(2*Math.PI - minAngle);
                e.endAngle   = 2*Math.PI;
                e.SortAngles();
                yield view;
            }
        }
    } while (worker && !completed);

    {
        const fStartAngle = e.startAngle;
        const fEndAngle = e.endAngle;

        let animProgress = 0;
        while (animProgress < 1) {
            c.ctx.translate(c.width/2, c.height/2);

            animProgress = Math.min(1, animProgress + c.stats.dt / fadeOutDuration);
            const animEasedProgress = a.Ease.InCubic(animProgress);

            e.startAngle = a.Lerp(animEasedProgress*0.5, fStartAngle, fEndAngle);
            e.endAngle   = a.Lerp(animEasedProgress*0.5, fEndAngle, fStartAngle);
            e.SortAngles();
            yield view;
        }
    }

    yield a.Clear();
}
