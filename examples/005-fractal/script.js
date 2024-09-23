import * as a from "../../animation.js";

window.addEventListener("load", () => {
    const canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer(canvas);

    player.ResizeRaw(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.ResizeRaw(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("keypress", ev => {
        if (ev.key === " ") {
            if (player.playing) {
                player.Pause();
            } else player.Start();
        }
    });

    player.Play(Animation);
    player.Play(a.Debug.FrameRate, [a.FontSpec(24, "JetBrains Mono")]);
});

function PathRenderer(path) {
    return ctx => {
        if (path.length < 2)
            return;

        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        for (const p of path)
            ctx.lineTo(p[0], p[1]);
        ctx.stroke();
    };
}

function RotatedAroundPivot(point, pivot, cosA, sinA) {
    if (!sinA) {
        sinA = Math.sin(cosA);
        cosA = Math.cos(cosA);
    }

    const [ px, py ] = point;
    const [ ox, oy ] = pivot;

    const dx = px-ox;
    const dy = py-oy;

    const rx = dx * cosA - dy * sinA;
    const ry = dx * sinA + dy * cosA;

    return [ rx + ox, ry + oy ];
}

/** @param {a.AnimationContext} c */
function* Animation(c) {
    const animDuration  = 1;
    const segmentLength = 50;
    const maxSegments   = 32e3;

    const strokeStyle = "#e6e2e1";

    let scale = 3;
    const path = [ [ 0, segmentLength/2 ], [ 0, -segmentLength/2 ] ];

    while (path.length < maxSegments) {
        console.debug("Lines:", path.length);
        const fullRotation = -Math.PI/2;
        const pivot = path[path.length-1];

        {
            // Draw the path once
            c.ctx.translate(c.width/2, c.height/2);
            c.ctx.scale(scale, scale);
            c.ctx.lineWidth = 2/scale;
            c.ctx.strokeStyle = strokeStyle;
            yield PathRenderer(path);
        }

        let animTime = 0;
        const startingScale = scale;
        const targetScale   = scale/Math.SQRT2;
        while (animTime < animDuration) {
            animTime += c.stats.dt;

            const animProgress = Math.min(1, animTime/animDuration);
            scale = a.Lerp(animProgress, startingScale, targetScale);

            const rot  = fullRotation * animProgress;
            const cosA = Math.cos(rot);
            const sinA = Math.sin(rot);

            // Draw the path and its rotated version
            c.ctx.translate(c.width/2, c.height/2);
            c.ctx.scale(scale, scale);
            c.ctx.lineWidth = 2/scale;
            c.ctx.strokeStyle = strokeStyle;
            yield [
                PathRenderer(path),
                PathRenderer(path.map(p => RotatedAroundPivot(p, pivot, cosA, sinA))),
            ];
        }

        { // Update the path to include the rotated version
            const cos = Math.cos(fullRotation);
            const sin = Math.sin(fullRotation);
            // The last point is the pivot which is still part of the path.
            // So it shouldn't be copied.
            for (let i = path.length-2; i >= 0; i--)
                path.push(RotatedAroundPivot(path[i], pivot, cos, sin));
        }
    }
    console.debug("Lines:", path.length);

    // The main animation is done! Continue rendering the current path
    while (true) {
        c.ctx.translate(c.width/2, c.height/2);
        c.ctx.scale(scale, scale);
        c.ctx.lineWidth = 2/scale;
        c.ctx.strokeStyle = strokeStyle;
        yield PathRenderer(path);
    }
}
