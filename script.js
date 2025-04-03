document.addEventListener('DOMContentLoaded', () => {
    const arrayInput = document.getElementById('arrayInput');
    const sortButton = document.getElementById('sortButton');
    const arrayContainer = document.getElementById('arrayContainer');
    const statusDiv = document.getElementById('status');
    const speedControl = document.getElementById('speedControl');
    const speedValueSpan = document.getElementById('speedValue');
    // *** MODIFICATION: Get reference to step log list ***
    const stepLogList = document.getElementById('stepLogList');
    // *** END MODIFICATION ***

    let animationSpeed = parseInt(speedControl.value); // Milliseconds per step
    let bars = []; // To store references to the bar elements
    let isSorting = false;

    // --- Event Listeners ---
    sortButton.addEventListener('click', () => {
        if (isSorting) return; // Prevent starting multiple sorts

        const inputText = arrayInput.value.trim();
        if (!inputText) {
            updateStatus("Please enter some numbers.", "error");
            return;
        }

        const numbers = inputText.split(',')
            .map(numStr => parseInt(numStr.trim()))
            .filter(num => !isNaN(num));

        if (numbers.length === 0) {
             updateStatus("No valid numbers entered.", "error");
            return;
        }
        if (numbers.length > 50) {
            updateStatus("Warning: Visualizing large arrays may be slow.", "warning");
        }

        // *** MODIFICATION: Clear previous log ***
        stepLogList.innerHTML = '';
        logStep('--- Starting Sort ---');
        // *** END MODIFICATION ***

        isSorting = true;
        sortButton.disabled = true;
        arrayInput.disabled = true;
        speedControl.disabled = true;
        updateStatus("Starting Insertion Sort...");

        generateBars(numbers);
        insertionSort(numbers);
    });

    speedControl.addEventListener('input', () => {
        animationSpeed = parseInt(speedControl.value);
        speedValueSpan.textContent = `${animationSpeed} ms`;
    });

    speedValueSpan.textContent = `${animationSpeed} ms`;


    // --- Helper Functions ---

    // Update status message
    function updateStatus(message, type = "info") {
        statusDiv.textContent = message;
        statusDiv.style.color = type === "error" ? "red" : type === "warning" ? "orange" : "black";
    }

    // Sleep function
    function sleep() {
        return new Promise(resolve => setTimeout(resolve, animationSpeed));
    }

    // *** MODIFICATION: Function to add step to the log ***
    function logStep(message) {
        const li = document.createElement('li');
        li.textContent = message;
        stepLogList.appendChild(li);
        // Optional: Auto-scroll to the bottom
        stepLogList.parentElement.scrollTop = stepLogList.parentElement.scrollHeight;
    }
    // *** END MODIFICATION ***

    // Generate visual bars
    function generateBars(arr) {
        arrayContainer.innerHTML = '';
        bars = [];
        // Handle empty array case for maxValue calculation
        const maxValue = arr.length > 0 ? Math.max(...arr) : 1;
        const safeMaxValue = maxValue === 0 ? 1 : maxValue; // Ensure maxValue is not 0

        const containerWidth = arrayContainer.offsetWidth;
        const containerHeight = arrayContainer.offsetHeight;
        // Calculate bar width (consider padding of container)
        const totalGapWidth = (arr.length + 1) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-gap').replace('px', '')) * 2;
        const containerPadding = parseFloat(getComputedStyle(arrayContainer).paddingLeft) + parseFloat(getComputedStyle(arrayContainer).paddingRight);
        const availableWidth = containerWidth - totalGapWidth - containerPadding;
        const barWidth = Math.max(5, Math.floor(availableWidth / Math.max(1, arr.length))); // Avoid division by zero

        // Calculate available height (consider padding)
        const containerPaddingBottom = parseFloat(getComputedStyle(arrayContainer).paddingBottom);
        const containerPaddingTop = parseFloat(getComputedStyle(arrayContainer).paddingTop);
        const availableHeight = containerHeight - containerPaddingBottom - containerPaddingTop - 5; // Minus 5 for safety margin


        arr.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.classList.add('bar');
            // Scale height relative to the max value and available height
             const barHeightPercentage = (value / safeMaxValue);
             // Ensure barHeight is at least a minimum value (e.g., 2px) even for 0 values, but allow 0 height if value is 0.
             const barHeight = value === 0 ? 0 : Math.max(2, barHeightPercentage * availableHeight);

            bar.style.height = `${barHeight}px`;
            bar.style.width = `${barWidth}px`;

            const valueSpan = document.createElement('span');
            valueSpan.classList.add('bar-value');
            valueSpan.textContent = value;
            bar.appendChild(valueSpan);

            bar.dataset.value = value;

            arrayContainer.appendChild(bar);
            bars.push(bar);
        });
    }

    // --- Insertion Sort Algorithm with Visualization and Logging ---
    async function insertionSort(arr) {
        const n = arr.length;
        if (n <= 1) {
            if (n === 1) {
                bars[0].classList.add('sorted');
                logStep(`Array has only one element (${arr[0]}), already sorted.`);
            } else {
                 logStep("Array is empty, nothing to sort.");
            }
            finishSort();
            return;
        }

        logStep(`Element at index 0 (${arr[0]}) is considered sorted.`);
        bars[0].classList.add('sorted');

        for (let i = 1; i < n; i++) {
            let key = arr[i];
            let keyBar = bars[i];
            let j = i - 1;

            const statusMsgKey = `Selecting element ${key} (index ${i}) as the key.`;
            updateStatus(statusMsgKey);
            logStep(statusMsgKey);
            keyBar.classList.add('comparing'); // Highlight the key element
            await sleep();

            // Find the correct position
            while (j >= 0 && arr[j] > key) {
                const statusMsgCompare = `Comparing key ${key} with ${arr[j]} (index ${j}).`;
                 const statusMsgShift = `${arr[j]} > ${key}, so shift ${arr[j]} from index ${j} to ${j+1}.`;
                 updateStatus(`${statusMsgCompare} ${statusMsgShift}`);
                 logStep(statusMsgCompare);
                 logStep(statusMsgShift);

                bars[j].classList.add('comparing');
                bars[j].classList.add('shifting');
                bars[j+1].classList.add('shifting');
                await sleep();

                // Animate shift
                updateBar(bars[j+1], arr[j]);
                arr[j + 1] = arr[j];

                bars[j].classList.remove('comparing', 'shifting');
                bars[j+1].classList.remove('shifting');
                bars[j].classList.add('sorted'); // This element relative to the shift is sorted now

                j--;

                if (j >= 0) {
                     const statusMsgNextCompare = `Moving comparison to index ${j} (${arr[j]}).`;
                     updateStatus(statusMsgNextCompare);
                     // logStep(statusMsgNextCompare); // Logging this might be too verbose, log comparison in next loop iter
                     bars[j].classList.add('comparing');
                } else {
                     const statusMsgInsertStart = `Reached start of sorted section. Key ${key} will be inserted at index 0.`;
                     updateStatus(statusMsgInsertStart);
                     logStep(statusMsgInsertStart);
                }
                 await sleep();
                 if (j>=0) bars[j].classList.remove('comparing');
            }

             // Log comparison result if the loop condition (arr[j] > key) failed
             if (j >= 0) {
                 const logMsgCompareEnd = `Comparing key ${key} with ${arr[j]} (index ${j}). Condition (${arr[j]} > ${key}) is false.`;
                 logStep(logMsgCompareEnd);
                 // Momentarily highlight for clarity
                 bars[j].classList.add('comparing');
                 await sleep();
                 bars[j].classList.remove('comparing');
             }


             // Place the key
             const insertionIndex = j + 1;
             const statusMsgInsert = `Inserting key ${key} at index ${insertionIndex}.`;
             updateStatus(statusMsgInsert);
             logStep(statusMsgInsert);

             arr[insertionIndex] = key;
             updateBar(bars[insertionIndex], key); // Update the visual bar
             bars[insertionIndex].classList.add('sorted');
             bars[insertionIndex].classList.remove('comparing'); // Clean up just in case

             keyBar.classList.remove('comparing'); // Remove highlight from original key position if different

             // Mark all bars up to i as sorted visually
             for (let k = 0; k <= i; k++) {
                 bars[k].classList.add('sorted');
                 bars[k].classList.remove('comparing', 'shifting');
             }
             logStep(`Elements up to index ${i} are now sorted.`);
             await sleep();
        }

        finishSort();
    }

    // Helper to update bar visuals
    function updateBar(barElement, newValue) {
         const allValues = bars.map(b => parseInt(b.dataset.value || 0));
         const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
         const safeMaxValue = maxValue === 0 ? 1 : maxValue;

         const containerHeight = arrayContainer.offsetHeight;
         const containerPaddingBottom = parseFloat(getComputedStyle(arrayContainer).paddingBottom);
         const containerPaddingTop = parseFloat(getComputedStyle(arrayContainer).paddingTop);
         const availableHeight = containerHeight - containerPaddingBottom - containerPaddingTop - 5;

         const barHeightPercentage = (newValue / safeMaxValue);
         const barHeight = newValue === 0 ? 0 : Math.max(2, barHeightPercentage * availableHeight);

         barElement.style.height = `${barHeight}px`;
         barElement.dataset.value = newValue;

         const valueSpan = barElement.querySelector('.bar-value');
         if (valueSpan) {
             valueSpan.textContent = newValue;
         } else {
             const newValueSpan = document.createElement('span');
             newValueSpan.classList.add('bar-value');
             newValueSpan.textContent = newValue;
             barElement.innerHTML = '';
             barElement.appendChild(newValueSpan);
         }
     }


    // Called when sorting finishes
    function finishSort() {
        const finalMsg = "Sorting Complete!";
        updateStatus(finalMsg, "success");
        logStep(`--- ${finalMsg} ---`);
        bars.forEach(bar => {
             bar.classList.remove('comparing', 'shifting');
             bar.classList.add('sorted');
        });
        isSorting = false;
        sortButton.disabled = false;
        arrayInput.disabled = false;
        speedControl.disabled = false;
    }

    // Initial generation if there's a default value
    if (arrayInput.value) {
        const initialNumbers = arrayInput.value.trim().split(',')
            .map(numStr => parseInt(numStr.trim()))
            .filter(num => !isNaN(num));
        if (initialNumbers.length > 0) {
            generateBars(initialNumbers);
            updateStatus("Enter numbers or click Sort with the current example.");
        }
    }
});
