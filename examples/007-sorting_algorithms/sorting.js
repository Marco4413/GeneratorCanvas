import * as a from "../../animation.js";
import * as f from "../../frame.js";

// This was put into its own file so that I can import it from other websites.

export const ActionType = Object.freeze({
    HIGHLIGHT: 0,
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

export function* BubbleSort(array, key=(o => o), comparator=((a, b) => a-b)) {
    for (let i = 0; i < array.length-1; i++) {
        let minI = i;
        for (let j = i+1; j < array.length; j++) {
            yield [
                [ActionType.COMPARE, j, minI],
                [ActionType.HIGHLIGHT, i]];
            if (comparator(key(array[j]), key(array[minI])) < 0) {
                minI = j;
            }
        }
        if (minI === i) {
            yield [[ActionType.HIGHLIGHT, i]];
        } else {
            yield [[ActionType.SWAP, i, minI]];
            const tmp   = array[i];
            array[i]    = array[minI];
            array[minI] = tmp;
        }
    }
}

export function* AnimatableBubbleSort(array) {
    yield* BubbleSort(array);
}

export function* InsertionSort(array, p, q, key=(o => o), comparator=((a, b) => a-b)) {
    // InsertionSort
    //     was modified to accept a range in which to operate [p,q)
    //      the change was needed to visualize the BucketSort algorithm.
    //     The old loops are still here to allow anyone to see the simplest implementation.
    // for (let i = 1; i < array.length; i++) {
    for (let i = p+1; i < q; i++) {
        yield [[ActionType.HIGHLIGHT, i]];
        let j = i-1;
        // while (j >= 0) {
        while (j >= p) {
            yield [[ActionType.COMPARE, j+1, j]];
            if (comparator(key(array[j+1]), key(array[j])) >= 0)
                break;

            yield [[ActionType.SWAP, j+1, j]];
            const tmp  = array[j];
            array[j]   = array[j+1];
            array[j+1] = tmp;
            --j;
        }
    }
}

export function* AnimatableInsertionSort(array) {
    yield* InsertionSort(array, 0, array.length);
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
            yield [[ActionType.HIGHLIGHT, i]];
            ++i;
        } else {
            buffer[k++] = array[j];
            yield [[ActionType.HIGHLIGHT, j]];
            ++j;
        }
    }

    for (; i < r; ++i)
        buffer[k++] = array[i];
    for (; j < q; ++j)
        buffer[k++] = array[j];

    for (k = 0; k < buffer.length; ++k) {
        array[p+k] = buffer[k];
        yield [[ActionType.HIGHLIGHT, p+k]];
    }
}

export function* MergeSort(array, p, q, key=(o => o), comparator=((a, b) => a-b)) {
    if (q-p <= 1) return;
    yield [
        [ActionType.HIGHLIGHT, p],
        [ActionType.HIGHLIGHT, q-1]];
    const r = Math.floor((p+q)/2);
    yield* ZipActions(
        MergeSort(array, p, r, key, comparator),
        MergeSort(array, r, q, key, comparator))
    yield* Merge(array, p, r, q, key, comparator);
}

export function* AnimatableMergeSort(array) {
    yield* MergeSort(array, 0, array.length);
}

export function* LomutoPartition(array, p, q, key, comparator) {
    if (q-p <= 1) {
        throw new Error(`Invalid range [${q},${p}) in array of len ${array.length}`);
    }

    let xi  = q-1;
    const x = key(array[xi]);
    yield [[ActionType.HIGHLIGHT, xi]];

    let i = p-1;
    for (let j = p; j < q; j++) {
        yield [[ActionType.COMPARE, j, xi]];
        if (comparator(key(array[j]), x) <= 0) {
            if (i+1 !== j) {
                yield [
                    [ActionType.HIGHLIGHT, xi],
                    [ActionType.SWAP, i+1, j]];

                const tmp  = array[j];
                array[j]   = array[i+1];
                array[i+1] = tmp;

                // Keep track of the pivot's position.
                // This is not needed by this algorithm.
                // However, it will be useful when the pivot
                //  index will be moved to an optional argument.
                switch (xi) {
                case i+1: xi = j;   break;
                case j:   xi = i+1; break;
                default:
                }
            }
            ++i;
        }
    }

    return i;
}

export function* HoarePartition(array, p, q, key, comparator) {
    if (q-p <= 1) {
        throw new Error(`Invalid range [${q},${p}) in array of len ${array.length}`);
    }

    let xi  = p;
    const x = key(array[xi]);
    yield [[ActionType.HIGHLIGHT, xi]];

    let i = p;
    let j = q-1;

    while (true) {
        yield [[ActionType.COMPARE, i, xi]];
        while (comparator(key(array[i]), x) < 0) {
            ++i;
            yield [[ActionType.COMPARE, i, xi]];
        }

        yield [[ActionType.COMPARE, j, xi]];
        while (comparator(key(array[j]), x) > 0) {
            --j;
            yield [[ActionType.COMPARE, j, xi]];
        }

        if (i >= j) {
            return j;
        }

        yield [
            [ActionType.HIGHLIGHT, xi],
            [ActionType.SWAP, i, j]];
        const tmp = array[j];
        array[j]  = array[i];
        array[i]  = tmp;

        // Keep track of the pivot's position
        switch (xi) {
        case i: xi = j; break;
        case j: xi = i; break;
        default:
        }
    }
}

export function* QuickSort(array, p, q, partition=LomutoPartition, key=(o => o), comparator=((a, b) => a-b)) {
    if (q-p <= 1) return;
    const it = partition(array, p, q, key, comparator);
    const r = (it && it.next) ? (yield* it) : it;
    yield* ZipActions(
        QuickSort(array, p, r, partition, key, comparator),
        QuickSort(array, r+1, q, partition, key, comparator),
    );
}

export function* AnimatableQuickSort(array) {
    yield* QuickSort(array, 0, array.length, LomutoPartition);
}

export function* AnimatableHoareQuickSort(array) {
    yield* QuickSort(array, 0, array.length, HoarePartition);
}

export function HeapLeft(i) {
    return i*2;
}

export function HeapRight(i) {
    return i*2+1;
}

export function* Heapify(heap, i, key, comparator) {
    while (true) {
        const leftI  = HeapLeft(i);
        const rightI = HeapRight(i);
    
        let swapI = i;
        if (leftI < heap.$heapSize) {
            yield [[ActionType.COMPARE, leftI, swapI]];
            if (comparator(key(heap[leftI]), key(heap[swapI])) < 0) {
                swapI = leftI;
            }
        }
    
        if (rightI < heap.$heapSize) {
            yield [[ActionType.COMPARE, rightI, swapI]];
            if (comparator(key(heap[rightI]), key(heap[swapI])) < 0) {
                swapI = rightI;
            }
        }
    
        if (swapI === i)
            break;
        
        {
            yield [[ActionType.SWAP, swapI, i]];
            const tmp = heap[swapI];
            heap[swapI] = heap[i];
            heap[i] = tmp;
            
            i = swapI; // Tail recursion
        }
    }
}

// Adds the field `$heapSize` to `array`
export function* HeapCreateInPlace(array, key, comparator) {
    array.$heapSize = array.length;
    for (let i = Math.floor(array.length/2); i >= 0; i--) {
        yield* Heapify(array, i, key, comparator);
    }
}

export function* HeapExtract(heap, key, comparator) {
    if (heap.$heapSize <= 0) return;
    else if (heap.$heapSize <= 1) {
        heap.$heapSize--;
        return heap[0];
    }

    heap.$heapSize--;
    yield [[ActionType.SWAP, 0, heap.$heapSize-1]];
    {
        const tmp = heap[heap.$heapSize];
        heap[heap.$heapSize] = heap[0];
        heap[0] = tmp;
    }

    yield* Heapify(heap, 0, key, comparator);
    return heap[heap.$heapSize];
}

// Adds the field `$heapSize` to `array`
export function* HeapSort(array, key=(o => o), comparator=((a, b) => a-b)) {
    const heapComparator = (a, b) => -comparator(a, b);
    yield* HeapCreateInPlace(array, key, heapComparator);
    while (array.$heapSize > 0) {
        yield* HeapExtract(array, key, heapComparator);
    }
}

// Adds the field `$heapSize` to `array`
export function* AnimatableHeapSort(array) {
    yield* HeapSort(array);
}

/**
 * @param {number[]} array Array of numbers in the range [0,1) with a uniform distribution
 * @param {number} bucketCount If undefined = array.length
 * @param {(array: any[], p: number, q: number, key: function, comparator: function) => void|Generator<number[][]>} bucketSorter
 * Any sorter which accepts a range and key, comparator functions.
 * If it's a Generator function, it must yield values which follow the standard of other sorters in this library.
 */
export function* BucketSort(array, bucketCount, bucketSorter=InsertionSort, key=(o => o), comparator=((a, b) => a-b)) {
    bucketCount = bucketCount ?? array.length;
    if (array.length <= 1) return;

    const buckets = new Array(bucketCount);
    for (let i = 0; i < buckets.length; i++)
        buckets[i] = [];

    for (let i = 0; i < array.length; i++) {
        yield [[ActionType.HIGHLIGHT, i]];
        const bi = Math.floor(key(array[i]) * buckets.length);
        buckets[bi].push(array[i]);
    }

    const bucketSorts = [];
    let i = 0;
    for (const bucket of buckets) {
        for (const val of bucket) {
            array[i] = val;
            yield [[ActionType.HIGHLIGHT, i]];
            ++i;
        }

        if (bucket.length > 1) {
            // InsertionSort could be replaced by any other sorter which works within a range.
            // InsertionSort is used by default because bucketCount = array.length
            // Moreover, the numbers are uniformly distributed.
            // Which means that bucket.length will always be small.
            const sorting = bucketSorter(array, i-bucket.length, i, key, comparator);
            // Since bucketSorter may be chosen by the user, make sure it's a Generator.
            // If so, push it into the list of all sorting generators.
            if (sorting && sorting.next) {
                bucketSorts.push(sorting);
            }
        }
    }

    yield* ZipActions(...bucketSorts);
}

export function* AnimatableBucketSort(array) {
    // If the array is uniformly distributed, in the best-case scenario,
    //  there will be at most 4 elements in each bucket.
    // Which InsertionSort should be able to handle quickly.
    yield* BucketSort(array, Math.floor(array.length/4));
}

// All sorters that work with SortingAnimation
export const Animatable = Object.freeze({
    BubbleSort:     AnimatableBubbleSort,
    InsertionSort:  AnimatableInsertionSort,
    MergeSort:      AnimatableMergeSort,
    /** Uses Lomuto's Partitioning */
    QuickSort:      AnimatableQuickSort,
    /** Uses Hoare's Partitioning */
    HoareQuickSort: AnimatableHoareQuickSort,
    HeapSort:       AnimatableHeapSort,
    BucketSort:     AnimatableBucketSort,
});

/**
 * `sortOpt.sorter` must be a sorter which sorts an array with
 * elements in the range [0,1). All functions from {@link Animatable}
 * are supported.
 * @param {a.AnimationContext} c
 * @param {object} sortOpt
 */
export function* SortingAnimation(c, sortOpt) {
    const array = new Array(sortOpt.itemCount ?? 256).fill(0).map(() => Math.random());
    // console.log(array);
    
    const defaultColor = a.HexColor("#e6e2e1");
    const selectColor  = a.HexColor("#5652f1");
    const swapColor    = a.HexColor("#56f251");
    const compareColor = a.HexColor("#f65251");
    const shrinkHeight = 0.75;
    const horizontalMargin = 0.15;
    const rects = array.map((_, idx) => new f.Rect(idx-array.length/2, 0, 1, 0, defaultColor));
    // console.log(rects);

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

    let stepsSinceLastUpdate = 0;
    let updateTime = 0;

    for (const actions of sortOpt.sorter(array)) {
        updateRects(defaultColor);

        const swaps = [];
        for (const action of actions) {
            switch (action[0]) {
            case ActionType.HIGHLIGHT: {
                const [_, idx] = action;
                rects[idx].color = selectColor;
            } break;
            case ActionType.SWAP: {
                const [_, i, j] = action;
                rects[i].color = swapColor;
                rects[j].color = swapColor;
                swaps.push(action);
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

        if (sortOpt.step) {
            while (!sortOpt.step()) {
                updateRects();
                yield view;
            }
        }

        if (sortOpt.stepsPerUpdate) {
            ++stepsSinceLastUpdate;
            if (stepsSinceLastUpdate < sortOpt.stepsPerUpdate)
                continue;
            stepsSinceLastUpdate = 0;
        }

        updateTime = 0;
        do {
            updateTime += c.stats.dt;
            updateRects();

            if (!sortOpt.disableAnimations) {
                const t = sortOpt.updateDelay > 0 ? Math.min(updateTime/sortOpt.updateDelay, 1) : 0;
                for (const [_, i, j] of swaps) {
                    const iX = rects[i].x;
                    const jX = rects[j].x;
                    rects[i].x = a.Lerp(a.Ease.InOutQuad(t), iX, jX);
                    rects[j].x = a.Lerp(a.Ease.InOutQuad(t), jX, iX);
                }
            }

            yield view;
        } while (updateTime < (sortOpt.updateDelay ?? -1));
    }

    updateTime = 0;
    do {
        updateTime += c.stats.dt;
        updateRects(defaultColor);
        yield view;
    } while (!sortOpt.stopAtEnd || updateTime < (sortOpt.updateDelay ?? -1));
}
