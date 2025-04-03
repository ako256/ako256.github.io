document.addEventListener('DOMContentLoaded', () => {
    const arrayInput = document.getElementById('arrayInput');
    const sortButton = document.getElementById('sortButton');
    const arrayContainer = document.getElementById('arrayContainer');
    const statusDiv = document.getElementById('status');
    const speedControl = document.getElementById('speedControl');
    const speedValueSpan = document.getElementById('speedValue');

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

        // Parse input string into an array of numbers
        const numbers = inputText.split(',')
            .map(numStr => parseInt(numStr.trim()))
            .filter(num => !isNaN(num)); // Filter out non-numeric values

        if (numbers.length === 0) {
             updateStatus("No valid numbers entered.", "error");
            return;
        }
        if (numbers.length > 50) { // Optional limit for performance/display
            updateStatus("Warning: Visualizing large arrays may be slow.", "warning");
        }

        isSorting = true;
        sortButton.disabled = true;
        arrayInput.disabled = true;
        speedControl.disabled = true;
        updateStatus("Starting Insertion Sort...");

        generateBars(numbers);
        insertionSort(numbers); // Start the async sorting process
    });

    speedControl.addEventListener('input', () => {
        animationSpeed = parseInt(speedControl.value);
        speedValueSpan.textContent = `${animationSpeed} ms`;
    });

    // Initialize speed display
    speedValueSpan.textContent = `${animationSpeed} ms`;


    // --- Helper Functions ---

    // Update status message
    function updateStatus(message, type = "info") {
        statusDiv.textContent = message;
        statusDiv.style.color = type === "error" ? "red" : type === "warning" ? "orange" : "black";
    }

    // Sleep function to pause execution for animation
    function sleep() {
        return new Promise(resolve => setTimeout(resolve, animationSpeed));
    }

    // Generate visual bars from the array
    function generateBars(arr) {
        arrayContainer.innerHTML = ''; // Clear previous bars
        bars = []; // Reset bar references
        const maxValue = Math.max(...arr, 1); // Avoid division by zero if all are 0 or array is empty
        const containerWidth = arrayContainer.offsetWidth;
        // Calculate bar width based on container size and number of elements
        const totalGapWidth = (arr.length + 1) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-gap').replace('px', '')) * 2;
        const availableWidth = containerWidth - totalGapWidth - 20; // Subtract padding
        const barWidth = Math.max(5, Math.floor(availableWidth / arr.length)); // Ensure minimum width


        arr.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.classList.add('bar');
            // Scale height relative to the max value and container height
            const barHeight = Math.max(5, (value / maxValue) * (arrayContainer.offsetHeight - 30)); // Subtract padding, ensure min height
            bar.style.height = `${barHeight}px`;
            bar.style.width = `${barWidth}px`;

             // Add value label below the bar
            const valueSpan = document.createElement('span');
            valueSpan.classList.add('bar-value');
            valueSpan.textContent = value;
            bar.appendChild(valueSpan);

            // Store reference and value for easier manipulation
            bar.dataset.value = value; // Store original value if needed

            arrayContainer.appendChild(bar);
            bars.push(bar); // Store the DOM element reference
        });
    }

    // --- Insertion Sort Algorithm with Visualization ---
    async function insertionSort(arr) {
        const n = arr.length;
        if (n <= 1) {
            if (n === 1) bars[0].classList.add('sorted'); // Mark single element as sorted
            finishSort();
            return;
        }

        bars[0].classList.add('sorted'); // First element is trivially sorted

        for (let i = 1; i < n; i++) {
            let key = arr[i];
            let keyBar = bars[i];
            let j = i - 1;

            updateStatus(`Selecting element ${key} at index ${i} as key.`);
            keyBar.classList.add('comparing'); // Highlight the key element
            await sleep();

            // Find the correct position for the key in the sorted subarray arr[0...i-1]
            while (j >= 0 && arr[j] > key) {
                updateStatus(`Comparing key ${key} with ${arr[j]} at index ${j}. ${arr[j]} > ${key}, shifting ${arr[j]} right.`);

                // Highlight element being compared
                bars[j].classList.add('comparing');
                // Highlight element being shifted (the one at j that will move to j+1)
                bars[j].classList.add('shifting');
                // Also highlight the spot it's moving to (j+1, currently holding key visually)
                bars[j+1].classList.add('shifting');

                await sleep();

                // --- Animate the shift ---
                // 1. Visually move bar[j] to position j+1
                // We achieve this by making bar[j+1] look like bar[j]
                 updateBar(bars[j+1], arr[j]); // Update height and value display
                 arr[j + 1] = arr[j]; // Update the underlying array *after* visual step

                // 2. Reset colors (except for sorted part and the key which is still 'held')
                bars[j].classList.remove('comparing', 'shifting');
                bars[j+1].classList.remove('shifting'); // Keep j+1 highlighted until key is placed
                bars[j].classList.add('sorted'); // The element at j is now part of the sorted segment relative to this shift

                j--; // Move to the next element on the left

                // If j is now < 0, the key goes to the start, otherwise prepare for next comparison
                if (j >= 0) {
                     updateStatus(`Moving comparison to index ${j}.`);
                     bars[j].classList.add('comparing'); // Highlight next comparison target
                } else {
                     updateStatus(`Key ${key} needs to be inserted at index 0.`);
                }
                 await sleep();
                 if (j>=0) bars[j].classList.remove('comparing'); // Clean up comparison highlight before next loop iteration or insertion
            }

             // Place the key in its correct position (j + 1)
            updateStatus(`Inserting key ${key} at index ${j + 1}.`);
             arr[j + 1] = key;
             // Update the visual bar at the insertion point
             updateBar(bars[j+1], key);
             bars[j+1].classList.add('sorted'); // Mark the inserted element as sorted
             bars[j+1].classList.remove('comparing'); // Ensure key highlight is removed


            // Clean up any lingering comparison highlights from the loop exit
             if (j >= 0) bars[j].classList.remove('comparing');
             keyBar.classList.remove('comparing'); // Remove key highlight (it might be the same bar as bars[j+1])

             // Mark all bars up to i as sorted visually
             for (let k = 0; k <= i; k++) {
                 bars[k].classList.add('sorted');
                 bars[k].classList.remove('comparing', 'shifting'); // Cleanup any stray states
             }
             await sleep();
        }

        finishSort();
    }

     // Helper to update a bar's visual appearance (height and value text)
     function updateBar(barElement, newValue) {
         const maxValue = Math.max(...bars.map(b => parseInt(b.dataset.value)), 1); // Recalculate max based on current values if needed, or use original max
         const barHeight = Math.max(5, (newValue / maxValue) * (arrayContainer.offsetHeight - 30));
         barElement.style.height = `${barHeight}px`;
         barElement.dataset.value = newValue; // Update stored value if you rely on it

         const valueSpan = barElement.querySelector('.bar-value');
         if (valueSpan) {
             valueSpan.textContent = newValue;
         } else { // If somehow span was lost, recreate it (robustness)
             const newValueSpan = document.createElement('span');
             newValueSpan.classList.add('bar-value');
             newValueSpan.textContent = newValue;
             barElement.innerHTML = ''; // Clear potential old text node
             barElement.appendChild(newValueSpan);
         }
     }


    // Called when sorting finishes
    function finishSort() {
        updateStatus("Sorting Complete!", "success");
        // Ensure all bars are marked as sorted and remove other states
        bars.forEach(bar => {
             bar.classList.remove('comparing', 'shifting');
             bar.classList.add('sorted');
        });
        isSorting = false;
        sortButton.disabled = false;
        arrayInput.disabled = false;
        speedControl.disabled = false;
    }
});
