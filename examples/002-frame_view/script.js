import * as a from "../../animation.js";
import * as f from "../../frame.js";

window.addEventListener("load", () => {
    const canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer(canvas);

    player.ResizeRaw(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.ResizeRaw(window.innerWidth, window.innerHeight);
    });

    const sharedParams = { mouseX: 0, mouseY: 0 };
    player.Play(MouseFollower, [sharedParams]);

    canvas.addEventListener("mousemove", ev => {
        sharedParams.mouseX = ev.x;
        sharedParams.mouseY = ev.y;
    });
});

function* MouseFollower(_, sharedParams) {
    const view = new f.FrameView();
    const circle = view.Add(new f.Circle(0, 0, 25, a.HexColor("#e6e2e1")));
    while (true) {
        circle.x = sharedParams.mouseX;
        circle.y = sharedParams.mouseY;
        yield view;
    }
}
