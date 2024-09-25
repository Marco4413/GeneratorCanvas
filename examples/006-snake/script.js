import * as a from "../../animation.js";

// TODO: Move all style options into a style object (including animation timings).
// TODO: Use a different canvas to display FrameRate (???)

const SnakeHelper = Object.freeze({
    DIR_UP:    1,
    DIR_DOWN:  2,
    DIR_LEFT:  3,
    DIR_RIGHT: 4,

    GAME_OVER_OUT_OF_SPACE:   1,
    GAME_OVER_SELF_COLLISION: 2,
    GAME_OVER_OUT_OF_BOUNDS:  3,

    AddDirection(p, dir) {
        switch (dir) {
        case SnakeHelper.DIR_UP:
            return [ p[0], p[1]-1 ];
        case SnakeHelper.DIR_DOWN:
            return [ p[0], p[1]+1 ];
        case SnakeHelper.DIR_LEFT:
            return [ p[0]-1, p[1] ];
        case SnakeHelper.DIR_RIGHT:
            return [ p[0]+1, p[1] ];
        default:
            throw new Error("unreachable");
        }
    },

    IsOppositeDirection(a, b) {
        return a === SnakeHelper.InvertDirection(b);
    },

    InvertDirection(dir) {
        switch (dir) {
        case SnakeHelper.DIR_UP:
            return SnakeHelper.DIR_DOWN;
        case SnakeHelper.DIR_DOWN:
            return SnakeHelper.DIR_UP;
        case SnakeHelper.DIR_LEFT:
            return SnakeHelper.DIR_RIGHT;
        case SnakeHelper.DIR_RIGHT:
            return SnakeHelper.DIR_LEFT;
        default:
            throw new Error("unreachable");
        }
    },

    OverlapsAny(x, points, startIndex=0) {
        for (let i = startIndex; i < points.length; i++) {
            const p = points[i];
            if (x[0] === p[0] && x[1] === p[1])
                return i;
        }
        return -1;
    },
});

class SnakeExtCtrl {
    constructor() {
        this.nextDirection = [];
        this.direction = SnakeHelper.DIR_UP;
        this.restart = false;
        this.skipSplash = false;
    }

    Restart() {
        this.nextDirection = [];
        this.direction = SnakeHelper.DIR_UP;
        this.restart = true;
        this.skipSplash = false;
    }
}

window.addEventListener("load", () => {
    const canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer(canvas);

    {
        const minSize = Math.min(window.innerWidth, window.innerHeight);
        player.ResizeRaw(minSize, minSize);
    }
    window.addEventListener("resize", () => {
        const minSize = Math.min(window.innerWidth, window.innerHeight);
        player.ResizeRaw(minSize, minSize);
    });

    const snakeExtCtrl = new SnakeExtCtrl();
    window.addEventListener("keydown", ev => {
        switch (ev.key.toLowerCase()) {
        case "r": snakeExtCtrl.Restart(); break;
        case " ": snakeExtCtrl.skipSplash = true; break;
        default:
        }

        // Handle direction, no more than 2 directions may be buffered
        if (snakeExtCtrl.nextDirection.length > 2)
            return;

        let nextDirection = undefined;
        switch (ev.key.toLowerCase()) {
        case "w":
        case "arrowup":    nextDirection = SnakeHelper.DIR_UP;    break;
        case "s":
        case "arrowdown":  nextDirection = SnakeHelper.DIR_DOWN;  break;
        case "a":
        case "arrowleft":  nextDirection = SnakeHelper.DIR_LEFT;  break;
        case "d":
        case "arrowright": nextDirection = SnakeHelper.DIR_RIGHT; break;
        default:
        }

        // Predict what direction the snake will be looking at based on previous inputs
        const currentDirection = snakeExtCtrl.nextDirection.length > 0
            ? snakeExtCtrl.nextDirection[snakeExtCtrl.nextDirection.length-1]
            : snakeExtCtrl.direction;
        // The next direction must not be the current one or its opposite
        if (nextDirection
            && nextDirection !== currentDirection
            && !SnakeHelper.IsOppositeDirection(nextDirection, currentDirection)
        ) snakeExtCtrl.nextDirection.push(nextDirection);
    });

    player.Play(SnakeGame, [ 17, 17, snakeExtCtrl ]);
    // player.Play(a.Debug.FrameRate, [a.FontSpec(24, "JetBrains Mono")]);
});

/**
 * @param {a.AnimationContext} c
 * @param {SnakeExtCtrl} extCtrl External Snake Game Controller
 */
function* SnakeGame(c, gridW, gridH, extCtrl) {
    {
        // Handle splash screen
        const splashTime = 5;
        const fadeOutTime = 1;

        let animTime = 0;
        while (animTime < splashTime+fadeOutTime && !extCtrl.skipSplash) {
            animTime += c.stats.dt;

            const textColor = a.HexColor("#e6e2e1");
            if (animTime >= splashTime) {
                const fadeOutProgress = Math.min(1, (animTime-splashTime)/fadeOutTime);
                textColor[3] *= 1-fadeOutProgress;
            }

            yield (function*() {
                c.ctx.fillStyle = a.ColorToStyle(textColor);

                // TODO: Adding some of this functionality to frame.js would be great.
                //       Mainly auto-layout. The Text class is already a good wrapper for simple text.
                //       Maybe something like RichText? With multi-line support and font/color changing.
                c.ctx.font = "32pt 'JetBrains Mono'";
                const title = "Snake";
                const titleMeasure = c.ctx.measureText(title);
                yield a.ShapeText(title, (c.width - titleMeasure.width)/2, (c.height - titleMeasure.actualBoundingBoxAscent)/2);

                c.ctx.font = "12pt 'JetBrains Mono'";
                const help = "Move with WASD, press Space to skip.";
                const helpMeasure = c.ctx.measureText(help);
                yield a.ShapeText(help, (c.width - helpMeasure.width)/2, c.height/2 + titleMeasure.actualBoundingBoxDescent + helpMeasure.actualBoundingBoxAscent);
            })();
        }
    }

    const updateInterval = 0.25;

    let direction = SnakeHelper.DIR_DOWN;

    let score  = 0;
    let snake  = [];
    let food   = [];
    let growth = 1;

    const snakeSize = 0.5;
    const foodSize  = 0.4;

    let gameOver = false;
    let gameOverReason = undefined;

    extCtrl.restart = true;
    while (true) {
        if (extCtrl.restart) {
            extCtrl.restart = false;


            direction = SnakeHelper.DIR_DOWN;
            extCtrl.nextDirection = [];
            extCtrl.direction = direction;

            score = 0;
            snake  = [ [Math.floor(gridW/2), Math.floor(gridH/2)] ];
            food   = [ [ 1, 1 ] ];
            growth = 1;

            gameOver = false;
            gameOverReason = undefined;

        }

        const nextDir = extCtrl.nextDirection.shift();
        if (nextDir) {
            direction = nextDir;
            extCtrl.direction = direction;
        }
        
        { // Animate Snake moving towards the current direction
            let animTime = 0;
            while (animTime < updateInterval) {
                animTime += c.stats.dt;
                const animProgress = Math.min(1, animTime/updateInterval);
                
                const headTarget = SnakeHelper.AddDirection(snake[0], direction);
                // "Copy" of snake with animating head and tail
                const aSnake = [[
                    a.Lerp(animProgress, snake[0][0], headTarget[0]),
                    a.Lerp(animProgress, snake[0][1], headTarget[1]),
                ]];
    
                // If only the head is present, we only want the point of the head.
                // Otherwise, we also want its duplicate to animate it either growing or moving.
                if (snake.length > 1 || growth >= 1)
                    aSnake.push(...snake);
                
                // The tail needs to be animated only if present and if the snake is not growing
                if (snake.length > 1 && growth <= 0) {
                    const tailTarget = snake[snake.length-2];
                    aSnake[aSnake.length-1] = [
                        a.Lerp(animProgress, aSnake[aSnake.length-1][0], tailTarget[0]),
                        a.Lerp(animProgress, aSnake[aSnake.length-1][1], tailTarget[1]),
                    ];
                }
                
                yield SnakeGameRenderer(c, aSnake, food, score, gridW, gridH, snakeSize, foodSize);
            }
        }

        // After the Snake has visually moved forward, move each body part and grow it
        const tail = snake[snake.length-1].slice();
        for (let i = snake.length-1; i >= 1; i--)
            snake[i] = snake[i-1];
        snake[0] = SnakeHelper.AddDirection(snake[0], direction);
        if (growth > 0) {
            snake.push(tail);
            growth--;
        }

        // No more space, bounds and self collision
        const head = snake[0];
        if (snake.length > gridW * gridH) {
            gameOver = true;
            gameOverReason = SnakeHelper.GAME_OVER_OUT_OF_SPACE;
            score *= 2;
        } else if (head[0] < 0 || head[0] >= gridW || head[1] < 0 || head[1] >= gridH) {
            gameOver = true;
            gameOverReason = SnakeHelper.GAME_OVER_OUT_OF_BOUNDS;
        } else if (SnakeHelper.OverlapsAny(head, snake, 1) >= 0) {
            gameOver = true;
            gameOverReason = SnakeHelper.GAME_OVER_SELF_COLLISION;
        }

        console.log("Score:", score);
        // Did the snake die?
        if (gameOver) {
            let animTime = 0;
            const headStart  = snake[0].slice();
            const headTarget = snake.length > 2
                ? snake[1].slice()
                : SnakeHelper.AddDirection(snake[0], SnakeHelper.InvertDirection(direction));
            while (animTime < updateInterval) {
                animTime += c.stats.dt;
                const animProgress = Math.min(1, animTime/updateInterval);
                const t = gameOverReason !== SnakeHelper.GAME_OVER_OUT_OF_BOUNDS
                    ? animProgress * snakeSize
                    : animProgress * (1+snakeSize)/2;
                snake[0][0] = a.Lerp(t, headStart[0], headTarget[0]);
                snake[0][1] = a.Lerp(t, headStart[1], headTarget[1]);
                yield SnakeGameRenderer(c, snake, food, score, gridW, gridH, snakeSize, foodSize);
            }
            while (gameOver && !extCtrl.restart) {
                yield (function*() {
                    c.ctx.save();
                    yield* SnakeGameRenderer(c, snake, food, score, gridW, gridH, snakeSize, foodSize);
                    c.ctx.restore();

                    // TODO: See the TODO of the splash screen.
                    c.ctx.font = "32pt 'JetBrains Mono'";
                    c.ctx.fillStyle = "#e6e2e1";

                    const title = gameOverReason === SnakeHelper.GAME_OVER_OUT_OF_SPACE
                        ? "You Won!" : "Game Over";
                    const titleMeasure = c.ctx.measureText(title);
                    yield a.ShapeText(title, (c.width - titleMeasure.width)/2, (c.height - titleMeasure.actualBoundingBoxAscent)/2);

                    c.ctx.font = "12pt 'JetBrains Mono'";
                    const help = "Press R to restart.";
                    const helpMeasure = c.ctx.measureText(help);
                    yield a.ShapeText(help, (c.width - helpMeasure.width)/2, c.height/2 + titleMeasure.actualBoundingBoxDescent + helpMeasure.actualBoundingBoxAscent);
                })();
            }
            continue;
        }

        { // Eat food if the head moved into a food cell
            const foodIndex = SnakeHelper.OverlapsAny(head, food);
            if (foodIndex >= 0) {
                const f = food[foodIndex];
                score += 10 * snake.length;
                growth++;

                // Regen food trying to make sure it does not overlap the snake
                let overlapsSnake = true;
                const maxSpawnAttempts = gridW * gridH;
                for (let i = 0; i < maxSpawnAttempts && overlapsSnake; i++) {
                    const spawnIndex = Math.floor(Math.random() * gridW * gridH)
                    f[0] = spawnIndex % gridW;
                    f[1] = Math.floor(spawnIndex / gridW);
                    if (SnakeHelper.OverlapsAny(f, snake) < 0) {
                        overlapsSnake = false;
                        break;
                    }
                }
                if (overlapsSnake)
                    console.warn("Food overlaps snake!", f);
            }
        }
    }
}

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

/**
 * Generates a single frame of the snake game
 * @param {a.AnimationContext} c
 * @param {[number, number][]} snake
 * @param {[number, number][]} food
 * @param {number} score
 * @param {number} gridW
 * @param {number} gridH
 * @param {number} snakeSize
 * @param {number} foodSize
 * @returns {a.FrameGenerator}
 */
function* SnakeGameRenderer(c, snake, food, score, gridW, gridH, snakeSize, foodSize) {
    const cellSize = Math.min(c.width / gridW, c.height / gridH);
    
    c.ctx.save();

    // Draw Grid
    c.ctx.lineWidth = 2;
    c.ctx.lineCap = "square";
    c.ctx.strokeStyle = "#222a30";

    c.ctx.beginPath();
    for (let i = 1; i < gridW; i++) {
        c.ctx.moveTo(0,        i * cellSize);
        c.ctx.lineTo(c.height, i * cellSize);
    }
    for (let i = 1; i < gridH; i++) {
        c.ctx.moveTo(i * cellSize, 0);
        c.ctx.lineTo(i * cellSize, c.width);
    }
    c.ctx.stroke();

    // Transform for Food and Snake
    c.ctx.scale(cellSize, cellSize);
    c.ctx.translate(0.5, 0.5);

    // Draw Food
    c.ctx.fillStyle = "#dd1100";
    const overlappingFood = [];
    for (const f of food) {
        // Don't check for head overlap
        if (SnakeHelper.OverlapsAny(f, snake, 1) >= 0) {
            overlappingFood.push(f);
        } else {
            yield a.ShapeCircle(f[0], f[1], foodSize/2, foodSize/2);
        }
    }

    // Draw Snake
    c.ctx.lineWidth = snakeSize;
    c.ctx.lineCap = "square";
    c.ctx.strokeStyle = "#115511";

    const head = snake[0];
    yield PathRenderer(snake);

    c.ctx.fillStyle = "#117711";
    yield a.ShapeRect(head[0]-snakeSize/2, head[1]-snakeSize/2, snakeSize, snakeSize);

    c.ctx.fillStyle = "#dd7700";
    for (const f of overlappingFood)
        yield a.ShapeCircle(f[0], f[1], foodSize/2, foodSize/2);
    
    c.ctx.restore();

    const scoreMargin = 5;
    const scoreLabel = `Score: ${score}`;
    c.ctx.font = "12pt 'JetBrains Mono'";
    c.ctx.fillStyle = "#e6e2e1";
    const textMeasure = c.ctx.measureText(scoreLabel);
    yield a.ShapeText(scoreLabel, c.width - textMeasure.width - scoreMargin, c.height - scoreMargin);
}
