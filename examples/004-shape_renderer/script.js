import * as a from "../../animation.js";

window.addEventListener("load", () => {
    const canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer(canvas);
    window.$player = player;

    const shapeIndex = [0];
    window.$shapeIndex = shapeIndex;
    console.log(`
Try changing the shape renderer using the following statements (depending on the browser, SnowflakeRec may be performance heavy):
  $shapeIndex[0] = 0; // Shape: Snowflake
  $shapeIndex[0] = 1; // Shape: SnowflakeRec
  $shapeIndex[0] = 2; // Shape: Star

You can change the accuracy of the FPS counter by setting $player.deltaSamples to a value greater than the default one.
    `.trim());

    player.ResizeRaw(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.ResizeRaw(window.innerWidth, window.innerHeight);
    });

    const mouseMove = {
        lastX: 0,
        lastY: 0,
        moveX: 0,
        moveY: 0,
        hasDragged: false,
        Consume() { this.hasDragged = false; }
    };

    canvas.addEventListener("mousemove", ev => {
        if (ev.buttons === 1) {
            mouseMove.hasDragged = true;
            mouseMove.moveX = ev.screenX - mouseMove.lastX;
            mouseMove.moveY = ev.screenY - mouseMove.lastY;
        }
        mouseMove.lastX = ev.screenX;
        mouseMove.lastY = ev.screenY;
    });

    window.addEventListener("keydown", ev => {
        switch (ev.key) {
        case "ArrowUp":
            shapeIndex[0] = Rotate(shapeIndex[0], -1, 3);
            console.log(`Shape set to ${shapeIndex[0]}.`);
            break;
        case "ArrowDown":
            shapeIndex[0] = Rotate(shapeIndex[0],  1, 3);
            console.log(`Shape set to ${shapeIndex[0]}.`);
            break;
        }
    });


    player.Play(Animation, [{mouseMove, shapeIndex}]);
    player.Play(a.Debug.FrameRate, [a.FontSpec(24, "JetBrains Mono")]);
});

function Rotate(val, delta, max) {
    const modVal = (val+delta)%max;
    if (modVal < 0)
        return max + modVal;
    return modVal;
}

/** @param {a.AnimationContext} c */
function* Animation(c, { mouseMove, shapeIndex }) {
    // const updateInterval = 0.064;
    // let timeSinceLastUpdate = 0;

    let x = c.width/2;
    let y = c.height/2;
    while (true) {
        // timeSinceLastUpdate += c.stats.dt;
        const shouldUpdate = true; // timeSinceLastUpdate >= updateInterval || mouseMove.hasDragged;
        if (mouseMove.hasDragged) {
            x += mouseMove.moveX;
            y += mouseMove.moveY;
            mouseMove.Consume();
        }

        if (shouldUpdate) {
            // timeSinceLastUpdate = 0;
            c.ctx.strokeStyle = "#e6e2e1";
            c.ctx.fillStyle = "#38404c";
            switch (shapeIndex[0]) {
            case 0:
                yield Snowflake(x, y, 8, 10, 100, 4);
                break;
            case 1:
                yield SnowflakeRec(x, y, 8, 10, 100, 4);
                break;
            case 2:
                yield Star(x, y, 100, 200, 5);
                break;
            default:
                yield a.Clear();
            }
        } else {
            yield a.Skip();
        }
    }
}

function Line(x1, y1, x2, y2, width) {
    return ctx => {
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };
}

// I don't really know what voodoo magic Chromium is doing, but this frame generator is as fast as the non-recursive shape-renderer.
function* SnowflakeFrameRec(x, y, branches, branchWidth, branchLength, depth=5, rotation=-Math.PI/2, _branchAngles=null) {
    // Very small optimization
    if (!_branchAngles) {
        const branchAngleStep = 2*Math.PI/branches;
        _branchAngles = [];
        for (let i = 0; i < branches; i++) {
            const branchAngle = branchAngleStep * i;
            const dx = Math.cos(branchAngle + rotation);
            const dy = Math.sin(branchAngle + rotation);
            _branchAngles.push([dx, dy]);
        }
    }

    for (let i = 0; i < branches; i++) {
        const [dx, dy] = _branchAngles[i];
        const x2 = x + dx * branchLength;
        const y2 = y + dy * branchLength;
        yield Line(x, y, x2, y2, branchWidth);
        if (depth > 1)
            yield* SnowflakeFrameRec(x2, y2, branches, branchWidth*0.5, branchLength*0.5, depth-1, rotation, _branchAngles);
    }
}

// Wrapper to turn the recursive Snowflake FrameGenerator into a ShapeRenderer.
function SnowflakeRec(x, y, branches, branchWidth, branchLength, depth, rotation) {
    return ctx => {
        const gen = SnowflakeFrameRec(x, y, branches, branchWidth, branchLength, depth, rotation);
        for (const shape of gen) shape(ctx);
    };
}

// Very optimized Firefox Snowflake ShapeRenderer. Very pointless in Chromium.
function Snowflake(x, y, branches, branchWidth, branchLength, depth=5, rotation=-Math.PI/2) {
    return ctx => {
        const branchAngleStep = 2*Math.PI/branches;
        const branchAngles = [];
        for (let i = 0; i < branches; i++) {
            const branchAngle = branchAngleStep * i;
            const dx = Math.cos(branchAngle + rotation);
            const dy = Math.sin(branchAngle + rotation);
            branchAngles.push([dx, dy]);
        }

        let parentLeaves  = [[x, y]];
        let childInsIndex = 0;
        let childLeaves   = new Array(parentLeaves.length * branches);

        while (depth > 0) {
            ctx.beginPath();
            ctx.lineWidth = branchWidth;
            for (let i = 0; i < parentLeaves.length; ++i) {
                const [x, y] = parentLeaves[i];
                for (let j = 0; j < branches; j++) {
                    const [dx, dy] = branchAngles[j];
                    const x2 = x + dx * branchLength;
                    const y2 = y + dy * branchLength;
                    if (depth > 1) childLeaves[childInsIndex++] = [ x2, y2 ];
                    ctx.moveTo(x, y);
                    ctx.lineTo(x2, y2);
                }
            }
            ctx.stroke();

            if (--depth > 0) {
                parentLeaves  = childLeaves;
                childInsIndex = 0;
                childLeaves   = new Array(parentLeaves.length * branches);
                branchWidth  *= 0.5;
                branchLength *= 0.5;
            }
        }
    };
}

function Star(x, y, innerRadius, outerRadius, tips, fill=true, rotation=0) {
    return ctx => {
        const halfPI = Math.PI/2;
        const angleStep = Math.PI/tips;

        ctx.beginPath();
        ctx.moveTo(x + Math.cos(rotation - halfPI)*outerRadius, y + Math.sin(rotation - halfPI)*outerRadius);
        for (let i = 0; i < tips; i++) {
            const innerAngle = angleStep * (i*2+1) - halfPI + rotation;
            const outerAngle = angleStep * (i*2+2) - halfPI + rotation;

            ctx.lineTo(x + Math.cos(innerAngle)*innerRadius, y + Math.sin(innerAngle)*innerRadius);
            ctx.lineTo(x + Math.cos(outerAngle)*outerRadius, y + Math.sin(outerAngle)*outerRadius);
        }
        ctx.closePath();

        if (fill) ctx.fill();
        ctx.stroke();
    };
}

