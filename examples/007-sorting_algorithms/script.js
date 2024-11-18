import * as a from "../../animation.js";
import { Animatable, SortingAnimation } from "./sorting.js";

/** @param {HTMLElement} form */
function SerializeForm(form) {
    const inputs = form.querySelectorAll("input, select");
    const searchParams = new URLSearchParams();
    for (const input of inputs) {
        if (input.type === "button")
            continue;
        const name = input.name.length > 0
            ? input.name : input.id;
        switch (input.type) {
        case "checkbox":
            searchParams.append(name, input.checked ? "on" : "off");
            break;
        default:
            searchParams.append(name, input.value);
        }
    }
    return searchParams.toString();
}

/** @param {HTMLElement} form */
function DeserializeForm(form, params) {
    const searchParams = new URLSearchParams(params);
    const inputs = form.querySelectorAll("input, select");
    for (const input of inputs) {
        if (input.type === "button")
            continue;
        const name = input.name.length > 0
            ? input.name : input.id;
        const value = searchParams.get(name);
        if (value) {
            switch (input.type) {
            case "checkbox":
                input.checked = value !== "off";
                break;
            default:
                input.value = value;
            }
        }
    }
}

window.addEventListener("load", () => {
    const $canvas = document.getElementById("animation");
    const player = new a.AnimationPlayer($canvas);

    player.ResizeRaw(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => {
        player.ResizeRaw(window.innerWidth, window.innerHeight);
    });

    const $settings = document.getElementById("settings");

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
        sorter: Animatable.InsertionSort,
        step: () => {
            if (!$enableStepper.checked)
                return true;
            const canStep = stepOnce;
            stepOnce = false;
            return canStep;
        },
    };

    // Exported so they can be accessed through DevTools
    // Pressing the "Restart" button will apply all changes
    window.__animatable = Animatable;
    window.__sortOpt    = sortOpt;

    /** @type {HTMLInputElement} */
    const $restart = document.getElementById("restart");
    const onRestart = () => {
        player.Stop();
        player.Play(SortingAnimation, [ sortOpt ]);
    };

    /** @type {HTMLInputElement} */
    const $link = document.getElementById("link");
    $link.addEventListener("click", () => {
        window.location.search = `?${SerializeForm($settings)}`;
    });

    /** @type {HTMLSelectElement} */
    const $algoSelect = document.getElementById("sorting-algorithm");
    const onSelectionUpdate = () => {
        const $option = $algoSelect.options.item($algoSelect.selectedIndex);
        switch ($option.value) {
        case "bubble": sortOpt.sorter = Animatable.BubbleSort;     break;
        case "insert": sortOpt.sorter = Animatable.InsertionSort;  break;
        case "merge":  sortOpt.sorter = Animatable.MergeSort;      break;
        case "quick":  sortOpt.sorter = Animatable.QuickSort;      break;
        case "quickh": sortOpt.sorter = Animatable.HoareQuickSort; break;
        case "heap":   sortOpt.sorter = Animatable.HeapSort;       break;
        case "bucket": sortOpt.sorter = Animatable.BucketSort;     break;
        default: break;
        }
        onRestart();
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

    DeserializeForm($settings, window.location.search);

    onStepSettingsChange();
    onItemCountChange();
    onSelectionUpdate();
});
