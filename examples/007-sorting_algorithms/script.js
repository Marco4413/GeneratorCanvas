import * as a from "../../animation.js";
import {
    AnimatableBubbleSort,
    AnimatableInsertionSort,
    AnimatableMergeSort,
    AnimatableQuickSort,
    AnimatableHeapSort,
    SortingAnimation,
} from "./sorting.js";


window.addEventListener("load", () => {
    const $canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer($canvas);

    player.ResizeRaw(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.ResizeRaw(window.innerWidth, window.innerHeight);
    });

    const $enableStepper = document.getElementById("enable-stepper");
    let stepOnce = false;

    $canvas.addEventListener("click", () => {
        stepOnce = true;
    });

    window.addEventListener("keypress", ev => {
        switch (ev.key.toLowerCase()) {
        case "s":
            stepOnce = true;
            break;
        default:
        }
    });

    const sortOpt = {
        sorter: AnimatableInsertionSort,
        step: () => {
            if (!$enableStepper.checked)
                return true;
            const canStep = stepOnce;
            stepOnce = false;
            return canStep;
        },
    };

    // Exported so it can be accessed through DevTools
    window.__sortOpt = sortOpt;

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
        case "bubble":
            sortOpt.sorter = AnimatableBubbleSort;
            onRestart();
            break;
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
        case "heap":
            sortOpt.sorter = AnimatableHeapSort;
            onRestart();
            break;
        default:
            break;
        }
    };

    /** @type {HTMLInputElement} */
    const $updateDelay = document.getElementById("update-delay");
    /** @type {HTMLInputElement} */
    const $stepsPerUpdate = document.getElementById("steps-per-update");
    const onStepSettingsChange = () => {
        if (!Number.isNaN($updateDelay.valueAsNumber))
            sortOpt.updateDelay = $updateDelay.valueAsNumber;
        if (!Number.isNaN($stepsPerUpdate.valueAsNumber))
            sortOpt.stepsPerUpdate = Math.round($stepsPerUpdate.valueAsNumber);
    };

    /** @type {HTMLInputElement} */
    const $itemCount = document.getElementById("item-count");
    const onItemCountChange = () => {
        if (!Number.isNaN($itemCount.valueAsNumber))
            sortOpt.itemCount = Math.max(0, Math.round($itemCount.valueAsNumber));
        onRestart();
    };

    $algoSelect.addEventListener("input", () => onSelectionUpdate());
    $updateDelay.addEventListener("input", () => onStepSettingsChange());
    $stepsPerUpdate.addEventListener("input", () => onStepSettingsChange());
    $itemCount.addEventListener("input", () => onItemCountChange());
    $restart.addEventListener("click", () => onRestart());

    onStepSettingsChange();
    onItemCountChange();
    onSelectionUpdate();
});
