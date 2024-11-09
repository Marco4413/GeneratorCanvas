import * as a from "../../animation.js";
import {
    AnimatableInsertionSort,
    AnimatableMergeSort,
    AnimatableQuickSort,
    SortingAnimation
} from "./sorting.js";


window.addEventListener("load", () => {
    const $canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer($canvas);

    player.ResizeRaw(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.ResizeRaw(window.innerWidth, window.innerHeight);
    });

    const sortOpt = { sorter: AnimatableInsertionSort, stepDelay: -1 };

    /** @type {HTMLInputElement} */
    const $restart = document.getElementById("restart");
    const onRestart = () => {
        player.Stop();
        player.Play(SortingAnimation, [ sortOpt ]);
    };

    /** @type {HTMLSelectElement} */
    const $algoSelect = document.getElementById("sorting-algorithm");
    const onSelectionUpdate = () => {
        const $option = $algoSelect.options.item($algoSelect.selectedIndex);
        switch ($option.value) {
        case "insert":
            sortOpt.sorter = AnimatableInsertionSort;
            onRestart();
            break;
        case "merge":
            sortOpt.sorter = AnimatableMergeSort;
            onRestart();
            break;
        case "quick":
            sortOpt.sorter = AnimatableQuickSort;
            onRestart();
            break;
        default:
            break;
        }
    };

    /** @type {HTMLInputElement} */
    const $stepDelay = document.getElementById("step-delay");
    const onStepDelayChange = () => {
        sortOpt.stepDelay = $stepDelay.valueAsNumber;
    };

    $algoSelect.addEventListener("change", () => onSelectionUpdate());
    $stepDelay.addEventListener("change", () => onStepDelayChange());
    $restart.addEventListener("click", () => onRestart());

    onStepDelayChange();
    onSelectionUpdate();
});
