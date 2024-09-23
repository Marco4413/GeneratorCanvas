import * as a from "../../animation.js";
import * as f from "../../frame.js";

window.addEventListener("load", () => {
    const canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer(canvas);

    player.ResizeRaw(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.ResizeRaw(window.innerWidth, window.innerHeight);
    });

    player.Play(Animation);
});

/** @param {a.AnimationContext} c */
function* Animation(c) {
    const view = new f.FrameView();
    const square = view.Add(new f.Rect(-12.5, -12.5, 25, 25, a.HexColor("#e6e2e1")));

    const work = WrapPromise(AsyncWait(2500).then(() => {
        if (Math.random() >= 0.5)
            return a.HexColor("#a3ffa1");
        else throw a.HexColor("#ffa2a1");
    }));

    while (!work.done) {
        c.ctx.translate(c.width/2, c.height/2);
        yield view;
    }

    square.color = work.resolved ? work.value : work.error;
    c.ctx.translate(c.width/2, c.height/2);
    yield view;
}

function WrapPromise(promise) {
    const wrap = {
        resolved: false, value: undefined,
        rejected: false, error: undefined,
        promise
    };

    promise.then(val  => {wrap.resolved = true; wrap.value = val;})
           .catch(err => {wrap.rejected = true; wrap.error = err;});
    return Object.defineProperty(wrap, "done", { get() { return this.resolved || this.rejected; } });
}

function AsyncWait(ms) {
    return new Promise(res => setTimeout(res, ms));
}
