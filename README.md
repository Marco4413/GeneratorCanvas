# Generator Canvas

## About

Generator Canvas is a JavaScript library which enables the rendering of canvas
animations through generator functions.

This project was inspired by [Motion Canvas](https://github.com/motion-canvas/motion-canvas).

TypeScript type definitions are provided as documentation and for auto-completion.
So it is recommended to check those out.

## Usage

This repo is hosted at [https://Marco4413.github.io/GeneratorCanvas](https://Marco4413.github.io/GeneratorCanvas).

That means you can import files through that link in your JS code:

```js
import * as a from "https://Marco4413.github.io/GeneratorCanvas/animation.js"
import * as f from "https://Marco4413.github.io/GeneratorCanvas/frame.js"

window.addEventListener("load", () => {
    const canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer(canvas);
    player.Resize(800, 600);
    player.Play(Animation);
});

function* Animation(c) {
    const square = new f.Rect(0, 0, 100, 100, a.HexColor("#e6e2e1"));

    const radius = 100;
    const rotSpeed = Math.PI;

    let rot = 0;
    while (true) {
        rot += c.stats.dt * rotSpeed;
        square.x = Math.cos(rot) * radius - square.w/2;
        square.y = Math.sin(rot) * radius - square.h/2;

        c.ctx.translate(c.width/2, c.height/2);
        yield square;
    }
}
```

## Examples

Source code for examples can be found in the [examples](examples) folder.

Since this repo is hosted on [GitHub Pages](https://Marco4413.github.io/GeneratorCanvas),
all examples are accessible through that page.
