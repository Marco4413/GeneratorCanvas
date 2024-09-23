import * as a from "../../animation.js";

window.addEventListener("load", () => {
    const canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer(canvas);

    // Use ResizeRaw if the player is constantly playing.
    // Otherwise use Resize which copies the contents of the canvas before resizing.
    player.ResizeRaw(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.ResizeRaw(window.innerWidth, window.innerHeight);
    });

    // BouncingSquare is called with the AnimationContext associated with it and any extra parameters provided in the array.
    // We can pass objects with properties that we want to change externally.
    // You could even make a game which is rendered using this library.
    const sharedParams = { bounceTime: 2.5 };
    player.Play(BouncingSquare, [sharedParams]);

    // As an example we can try changing the bounce time when scrolling.
    window.addEventListener("wheel", ev => {
        sharedParams.bounceTime = Math.max(0.25, sharedParams.bounceTime + ev.deltaY * 0.005);
        console.log("Bounce Time:", sharedParams.bounceTime);
    });
});

/** @param {a.AnimationContext} c */
function* BouncingSquare(c, sharedParams) {
    // Since this is a generator function, we can declare any variable and it will stay within the scope of the function.
    const size = 50;
    const maxHeight = 100;

    let dir = 1;
    let x = 0;

    while (true) {
        const speed = c.width/sharedParams.bounceTime;
        // The Animation module provides utilities which allow to speed up and/or ease animations.
        // Which means that c.stats.dt may be negative. So if you want to fully support those methods you should take that into account.
        const newX = x + c.stats.dt * speed * dir;
        // If the new x is out of bounds, change dir and snap it to the bounds.
        if (newX < 0) {
            dir = -dir;
            x = 0;
        } else if (newX > c.width-size) {
            dir = -dir;
            x = c.width-size;
        } else x = newX;

        const y = Math.sin(x/c.width * 2*Math.PI) * Math.min(maxHeight, (c.height-size)/2);

        // c.ctx is one of CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D
        // So you can use every method defined by them. Keep in mind that the context is reset each frame (each yield).
        c.ctx.translate(0, c.height/2);
        c.ctx.fillStyle = "#e6e2e1"
        yield a.ShapeRect(x, y-size/2, size, size);
    }
}
