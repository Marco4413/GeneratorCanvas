import * as a from "../../animation.js";
import * as f from "../../frame.js";

// This was put into its own file so that I can import it from other websites.

export const ActionType = Object.freeze({
    SELECT: 0,
    SWAP: 1,
    COMPARE: 2,
});

export function* ZipActions(...its) {
    while (its.length > 0) {
        const actions = [];
        for (let i = 0; i < its.length;) {
            const it = its[i].next();
            if (it.done) {
                its.splice(i, 1);
            } else {
                actions.push(...it.value)
                ++i;
            }
        }
        yield actions;
    }
}

export function* InsertionSort(array, key=(o => o), comparator=((a, b) => a-b)) {
    for (let i = 1; i < array.length; i++) {
        yield [[ActionType.SELECT, i]];
        let j = i-1;
        while (j >= 0 && comparator(key(array[j+1]), key(array[j])) < 0) {
            yield [[ActionType.COMPARE, j+1, j]];
            yield [[ActionType.SWAP, j+1, j]];
            const tmp  = array[j];
            array[j]   = array[j+1];
            array[j+1] = tmp;
            --j;
        }
    }
}

export function* AnimatableInsertionSort(array) {
    yield* InsertionSort(array);
}

export function* Merge(array, p, r, q, key, comparator) {
    const buffer = new Array(q-p).fill(0);
    let i = p;
    let j = r;
    let k = 0;
    while (i < r && j < q) {
        yield [[ActionType.COMPARE, i, j]];
        if (comparator(key(array[i]), key(array[j])) < 0) {
            buffer[k++] = array[i];
            yield [[ActionType.SELECT, i]];
            ++i;
        } else {
            buffer[k++] = array[j];
            yield [[ActionType.SELECT, j]];
            ++j;
        }
    }

    for (; i < r; ++i)
        buffer[k++] = array[i];
    for (; j < q; ++j)
        buffer[k++] = array[j];

    for (k = 0; k < buffer.length; ++k) {
        array[p+k] = buffer[k];
        yield [[ActionType.SELECT, p+k]];
    }
}

export function* MergeSort(array, p, q, key=(o => o), comparator=((a, b) => a-b)) {
    if (q-p <= 1) return;
    yield [
        [ActionType.SELECT, p],
        [ActionType.SELECT, q-1]];
    const r = (p+q)/2;
    yield* ZipActions(
        MergeSort(array, p, r, key, comparator),
        MergeSort(array, r, q, key, comparator))
    yield* Merge(array, p, r, q, key, comparator);
}

export function* AnimatableMergeSort(array) {
    yield* MergeSort(array, 0, array.length);
}

export function* Partition(array, p, q, key, comparator) {
    if (q-p <= 1) return 0;

    const xi = q-1;
    const x = key(array[xi]);

    let i = p-1;
    for (let j = p; j < q; j++) {
        yield [[ActionType.COMPARE, j, xi]];
        if (comparator(key(array[j]), x) <= 0) {
            yield [[ActionType.SWAP, i+1, j]];
            const tmp  = array[j];
            array[j]   = array[i+1];
            array[i+1] = tmp;
            ++i;
        }
    }

    return i;
}

export function* QuickSort(array, p, q, key=(o => o), comparator=((a, b) => a-b)) {
    if (q-p <= 1) return;
    const r = yield* Partition(array, p, q, key, comparator);
    yield* ZipActions(
        QuickSort(array, p, r, key, comparator),
        QuickSort(array, r+1, q, key, comparator),
    );
}

export function* AnimatableQuickSort(array) {
    yield* QuickSort(array, 0, array.length);
}

/** @param {a.AnimationContext} c */
export function* SortingAnimation(c, sortOpt) {
    const array = new Array(256).fill(0).map(() => Math.random());
    console.log(array);
    
    const defaultColor = a.HexColor("#e6e2e1");
    const selectColor  = a.HexColor("#5652f1");
    const swapColor    = a.HexColor("#56f251");
    const compareColor = a.HexColor("#f65251");
    const shrinkHeight = 0.75;
    const horizontalMargin = 0.15;
    const rects = array.map((_, idx) => new f.Rect(idx-array.length/2, 0, 1, 0, defaultColor));
    console.log(rects);

    const view = new f.FrameView();
    rects.forEach(rect => view.Add(rect));

    const updateRects = (newColor) => {
        const elWidth = c.width / rects.length;
        rects.forEach((rect, idx) => {
            rect.color = newColor ?? rect.color;
            rect.x = idx * elWidth;
            rect.y = c.height;
            rect.w = elWidth-(elWidth * horizontalMargin);
            rect.h = -c.height * array[idx] * shrinkHeight;
        });
    };

    for (const actions of sortOpt.sorter(array)) {
        updateRects(defaultColor);

        for (const action of actions) {
            switch (action[0]) {
            case ActionType.SELECT: {
                const [_, idx] = action;
                rects[idx].color = selectColor;
            } break;
            case ActionType.SWAP: {
                const [_, i, j] = action;
                rects[i].color = swapColor;
                rects[j].color = swapColor;
            } break;
            case ActionType.COMPARE: {
                const [_, i, j] = action;
                rects[i].color = compareColor;
                rects[j].color = compareColor;
            } break;
            default:
                break;
            }
        }

        let waitTime = 0;
        do {
            waitTime += c.stats.dt;
            updateRects();
            yield view;
        } while (waitTime < sortOpt.stepDelay);
    }

    while (true) {
        updateRects(defaultColor);
        yield view;
    }
}
