document.addEventListener('DOMContentLoaded', () => {
    // --- UTILS --- //
    const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const quotes = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It's not the load that breaks you down, it's the way you carry it.", author: "Lou Holtz" },
        { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
        { text: "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.", author: "Paul J. Meyer" }
    ];

    // --- DOM ELEMENT SELECTORS --- //
    const forms = document.querySelectorAll('.task-form');
    const taskLists = document.querySelectorAll('.task-list');
    const focusModeBtn = document.getElementById('focus-mode-btn');
    const focusModal = document.getElementById('focus-modal');
    const aiModal = document.getElementById('ai-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const focusTaskName = document.getElementById('focus-task-name');
    const timerDisplay = document.getElementById('timer-display');
    const startTimerBtn = document.getElementById('start-timer-btn');
    const pauseTimerBtn = document.getElementById('pause-timer-btn');
    const resetTimerBtn = document.getElementById('reset-timer-btn');
    const focusTaskList = document.getElementById('focus-task-list');
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const aiSuggestBtns = document.querySelectorAll('.ai-suggest-btn');
    const aiModalTitle = document.getElementById('ai-modal-title');
    const aiModalContent = document.getElementById('ai-modal-content');
    const aiCloseModalBtn = document.getElementById('ai-close-modal-btn');
    const themeOptions = document.getElementById('theme-options');
    const currentThemeName = document.getElementById('current-theme-name');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportXlsxBtn = document.getElementById('export-xlsx-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const focusTaskSelect = document.getElementById('focus-task-select');
    const focusCustomMins = document.getElementById('focus-custom-mins');
    const taskSearchInput = document.getElementById('task-search-input');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsTheme = document.getElementById('settings-theme');
    const settingsTimer = document.getElementById('settings-timer');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('close-help-btn');

    // --- DOM GUARD: Check all required elements exist ---
    [
        forms, taskLists, focusModeBtn, focusModal, aiModal, closeModalBtn,
        focusTaskName, timerDisplay, startTimerBtn, pauseTimerBtn, resetTimerBtn,
        focusTaskList, quoteText, quoteAuthor, aiModalTitle, aiModalContent,
        aiCloseModalBtn, themeOptions, currentThemeName, exportPdfBtn, exportXlsxBtn,
        themeToggleBtn, focusTaskSelect, focusCustomMins, taskSearchInput,
        settingsBtn, settingsModal, closeSettingsBtn, settingsTheme, settingsTimer,
        saveSettingsBtn, helpBtn, helpModal, closeHelpBtn
    ].forEach((el, i) => {
        if (el === null || el === undefined) {
            alert("A required element is missing from your HTML. Please check your HTML structure and IDs. (Index: " + i + ")");
            throw new Error("Missing DOM element(s). See alert for details.");
        }
    });

    // --- STATE MANAGEMENT --- //
    let tasks = JSON.parse(localStorage.getItem('tasks')) || { q1: [], q2: [], q3: [], q4: [] };
    let currentDraggedTask = null;

    // --- POMODORO TIMER STATE --- //
    let timerInterval = null;
    let timeLeft = 25 * 60;
    let isTimerRunning = false;
    let currentFocusTask = null;

    // --- GEMINI API HELPER --- //
    async function callGemini(prompt) {
        const apiKey = ""; // Canvas handles this
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`API call failed: ${response.status}`);
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Invalid API response:", result);
                return "Could not get a valid response from the AI.";
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return "Error contacting the AI assistant.";
        }
    }

    // --- CORE FUNCTIONS --- //
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateAllQuadrantSummaries();
        updateAllProgressBars();
    };

    const renderTasks = () => {
        taskLists.forEach(list => {
            list.innerHTML = '';
            const quadrantId = list.dataset.quadrantId;
            let filteredTasks = tasks[quadrantId];
            if (searchQuery) {
                filteredTasks = filteredTasks.filter(task =>
                    task.name.toLowerCase().includes(searchQuery) ||
                    (task.desc && task.desc.toLowerCase().includes(searchQuery))
                );
            }
            if (filteredTasks.length === 0) {
                list.innerHTML = `<li class="task-item empty">No tasks${searchQuery ? ' found.' : ' yet.'}</li>`;
            } else {
                filteredTasks.forEach(task => {
                    const taskElement = createTaskElement(task);
                    list.appendChild(taskElement);
                });
            }
        });
        updateAllQuadrantSummaries();
        updateAllProgressBars();
    };

    const createTaskElement = (task) => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.completed) li.classList.add('completed');
        li.setAttribute('draggable', 'true');
        li.dataset.taskId = task.id;
        li.dataset.quadrant = task.quadrant;

        li.innerHTML = `
            <div class="task-details">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} title="Mark as complete">
                <span class="task-name">${task.name}</span>
                ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ""}
            </div>
            <div class="task-actions">
                ${task.time ? `<span class="task-time"><i class="far fa-clock"></i> ${task.time} min</span>` : ''}
                <button class="ai-breakdown-btn" title="Break down task with AI"><i class="fas fa-wand-magic-sparkles"></i></button>
                <button class="delete-task-btn" title="Delete task"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragend', handleDragEnd);
        li.querySelector('.task-checkbox').addEventListener('change', () => toggleTaskCompletion(task.id, task.quadrant));
        li.querySelector('.delete-task-btn').addEventListener('click', () => deleteTask(task.id, task.quadrant));
        li.querySelector('.ai-breakdown-btn').addEventListener('click', () => handleAiBreakdown(task));

        return li;
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        const form = e.target;
        const taskInput = form.querySelector('.task-input');
        const descInput = form.querySelector('.desc-input');
        const timeInput = form.querySelector('.time-input');
        const quadrantId = form.dataset.quadrant;
        const taskName = taskInput.value.trim();
        const taskDesc = descInput ? descInput.value.trim() : "";
        if (!taskName) return;
        addTask(taskName, quadrantId, timeInput ? timeInput.value.trim() : null, taskDesc);
        form.reset();
        showToast("Task added!");
    };

    const addTask = (name, quadrantId, time = null, desc = "") => {
        const newTask = {
            id: generateId(),
            name,
            quadrant: quadrantId,
            time: time ? parseInt(time, 10) : null,
            desc,
            completed: false,
        };
        tasks[quadrantId].push(newTask);
        saveTasks();
        renderTasks();
    };

    const toggleTaskCompletion = (taskId, quadrantId) => {
        const task = tasks[quadrantId].find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            if (focusModal.classList.contains('active')) renderFocusTasks();
        }
    };

    const deleteTask = (taskId, quadrantId) => {
        tasks[quadrantId] = tasks[quadrantId].filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        if (focusModal.classList.contains('active')) renderFocusTasks();
    };

    const updateQuadrantSummary = (quadrantId) => {
        const totalTimeEl = document.getElementById(`total-time-${quadrantId}`);
        if (totalTimeEl) {
            const totalMinutes = tasks[quadrantId]
                .filter(task => !task.completed && task.time)
                .reduce((sum, task) => sum + task.time, 0);
            totalTimeEl.textContent = totalMinutes;
        }
    };

    const updateAllQuadrantSummaries = () => Object.keys(tasks).forEach(updateQuadrantSummary);

    // --- DRAG & DROP --- //
    const handleDragStart = (e) => { currentDraggedTask = e.target; setTimeout(() => e.target.classList.add('dragging'), 0); };
    const handleDragEnd = (e) => { e.target.classList.remove('dragging'); currentDraggedTask = null; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        const targetList = e.target.closest('.task-list');
        if (targetList && currentDraggedTask) {
            const taskId = currentDraggedTask.dataset.taskId;
            const oldQuadrant = currentDraggedTask.dataset.quadrant;
            const newQuadrant = targetList.dataset.quadrantId;
            const taskIndex = tasks[oldQuadrant].findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const [taskToMove] = tasks[oldQuadrant].splice(taskIndex, 1);
                taskToMove.quadrant = newQuadrant;
                tasks[newQuadrant].push(taskToMove);
                saveTasks();
                renderTasks();
            }
        }
    };

    // --- THEME SWITCHER --- //
    const applyTheme = (theme) => {
        document.body.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        currentThemeName.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    };

    themeOptions.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedTheme = e.target.dataset.theme;
        if (selectedTheme) applyTheme(selectedTheme);
    });

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            // Cycle through themes: dark -> light -> futuristic -> dark
            const current = document.body.dataset.theme;
            const next = current === 'dark' ? 'light' : current === 'light' ? 'futuristic' : 'dark';
            applyTheme(next);
        });
    }

    // --- FOCUS MODE & POMODORO --- //
    let focusTimerInterval = null;
    let focusTimeLeft = 25 * 60;
    let focusIsRunning = false;
    let focusSelectedTask = null;

    let defaultTimer = parseInt(localStorage.getItem('defaultTimer'), 10) || 25;

    // Render Q1 tasks in dropdown
    function renderFocusTaskSelect() {
        focusTaskSelect.innerHTML = '';
        const q1Tasks = tasks.q1.filter(t => !t.completed);
        if (q1Tasks.length === 0) {
            focusTaskSelect.innerHTML = '<option value="">No tasks</option>';
            focusSelectedTask = null;
            focusTaskName.textContent = 'All done! Great work!';
            updateFocusTimerDisplay();
            return;
        }
        q1Tasks.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name + (t.time ? ` (${t.time} min)` : '');
            focusTaskSelect.appendChild(opt);
        });
        // If previously selected task still exists, keep it selected
        if (focusSelectedTask && q1Tasks.some(t => t.id === focusSelectedTask.id)) {
            focusTaskSelect.value = focusSelectedTask.id;
            focusSelectedTask = q1Tasks.find(t => t.id === focusSelectedTask.id);
        } else {
            focusSelectedTask = q1Tasks[0];
            focusTaskSelect.value = focusSelectedTask.id;
        }
        focusTaskName.textContent = focusSelectedTask.name;
        focusCustomMins.value = focusSelectedTask.time || 25;
        setFocusTimer(focusCustomMins.value);
    }

    // Set timer to X minutes
    function setFocusTimer(mins) {
        focusTimeLeft = Math.max(1, parseInt(mins, 10) || defaultTimer) * 60;
        updateFocusTimerDisplay();
    }

    // Update timer display
    function updateFocusTimerDisplay() {
        const min = Math.floor(focusTimeLeft / 60);
        const sec = focusTimeLeft % 60;
        timerDisplay.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    // Start timer
    function startFocusTimer() {
        if (focusIsRunning || !focusSelectedTask) return;
        focusIsRunning = true;
        focusTimerInterval = setInterval(() => {
            focusTimeLeft--;
            updateFocusTimerDisplay();
            if (focusTimeLeft <= 0) {
                clearInterval(focusTimerInterval);
                focusIsRunning = false;
                toggleTaskCompletion(focusSelectedTask.id, focusSelectedTask.quadrant);
                renderTasks();
                renderFocusTaskSelect();
            }
        }, 1000);
    }

    // Pause timer
    function pauseFocusTimer() {
        focusIsRunning = false;
        clearInterval(focusTimerInterval);
    }

    // Reset timer
    function resetFocusTimer() {
        pauseFocusTimer();
        setFocusTimer(focusCustomMins.value);
    }

    // When modal opens
    function openFocusModal() {
        focusModal.style.display = 'flex';
        focusModal.classList.add('active');
        renderFocusTaskSelect();
        updateFocusTimerDisplay();
    }

    // When modal closes
    function closeFocusModal() {
        focusModal.style.display = 'none';
        focusModal.classList.remove('active');
        pauseFocusTimer();
    }

    // Event listeners for focus mode
    focusTaskSelect.addEventListener('change', () => {
        const taskId = focusTaskSelect.value;
        const q1Tasks = tasks.q1.filter(t => !t.completed);
        focusSelectedTask = q1Tasks.find(t => t.id === taskId);
        focusTaskName.textContent = focusSelectedTask ? focusSelectedTask.name : '';
        focusCustomMins.value = focusSelectedTask && focusSelectedTask.time ? focusSelectedTask.time : 25;
        setFocusTimer(focusCustomMins.value);
    });
    focusCustomMins.addEventListener('input', () => {
        setFocusTimer(focusCustomMins.value);
    });
    startTimerBtn.addEventListener('click', startFocusTimer);
    pauseTimerBtn.addEventListener('click', pauseFocusTimer);
    resetTimerBtn.addEventListener('click', resetFocusTimer);

    // --- AI FEATURE HANDLERS --- //
    const showAiModal = (title, content) => {
        aiModalTitle.textContent = title;
        aiModalContent.innerHTML = content;
        aiModal.style.display = 'flex';
        aiModal.classList.add('active');
    };

    const showLoadingInModal = (title) => showAiModal(title, '<div class="spinner"></div>');
    const closeAiModal = () => { aiModal.style.display = 'none'; aiModal.classList.remove('active'); };

    const handleAiBreakdown = async (task) => {
        showLoadingInModal(`Breaking Down: "${task.name}"`);
        const prompt = `Break down the following task into a simple list of actionable sub-tasks. Task: "${task.name}". Provide only a bulleted or numbered list of sub-tasks.`;
        const result = await callGemini(prompt);
        const subtasks = result.split('\n').filter(s => s.trim() !== '');
        let subtaskListHtml = '<ul>' + subtasks.map(s => `<li>${s.replace(/^[*-]\s*/, '')}</li>`).join('') + '</ul>';
        showAiModal(`Sub-tasks for: "${task.name}"`, subtaskListHtml);
    };

    const handleAiSuggest = async (quadrantId) => {
        const goal = prompt("Enter a high-level goal to generate tasks for (e.g., 'Plan a trip to Japan'):");
        if (!goal || goal.trim() === '') return;
        const quadrantName = { q1: 'Urgent & Important', q2: 'Not Urgent & Important', q3: 'Urgent & Not Important', q4: 'Not Urgent & Not Important' }[quadrantId];
        showLoadingInModal(`Generating tasks for "${goal}"`);
        const prompt = `Based on the goal "${goal}", generate a short list of 3-5 tasks that fit into the "${quadrantName}" quadrant of an Eisenhower Matrix. Provide only a simple list of tasks, each on a new line.`;
        const result = await callGemini(prompt);
        result.split('\n').filter(t => t.trim() !== '').forEach(taskName => {
            addTask(taskName.replace(/^[*-]\s*/, ''), quadrantId);
        });
        closeAiModal();
    };

    // --- PROGRESS BAR UPDATE --- //
    function updateProgressBar(quadrant) {
        const bar = document.getElementById(`progress-${quadrant}`);
        if (!bar) return;
        const total = tasks[quadrant].length;
        const completed = tasks[quadrant].filter(t => t.completed).length;
        const percent = total ? (completed / total) * 100 : 0;
        bar.style.width = percent + '%';
    }
    function updateAllProgressBars() {
        ['q1', 'q2', 'q3', 'q4'].forEach(updateProgressBar);
    }

    // --- TOAST NOTIFICATION --- //
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // --- INITIALIZATION & EVENT LISTENERS --- //
    if (forms && forms.length) {
        forms.forEach(form => form.addEventListener('submit', handleAddTask));
    }
    if (taskLists && taskLists.length) {
        taskLists.forEach(list => {
            list.addEventListener('dragover', handleDragOver);
            list.addEventListener('drop', handleDrop);
            list.addEventListener('dragend', handleDragEnd);
        });
    }
    if (aiSuggestBtns && aiSuggestBtns.length) {
        aiSuggestBtns.forEach(btn => btn.addEventListener('click', () => handleAiSuggest(btn.dataset.quadrant)));
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    focusModeBtn.addEventListener('click', openFocusModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFocusModal);
    if (startTimerBtn) startTimerBtn.addEventListener('click', startTimer);
    if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', pauseTimer);
    if (resetTimerBtn) resetTimerBtn.addEventListener('click', resetTimer);
    if (aiCloseModalBtn) aiCloseModalBtn.addEventListener('click', closeAiModal);

    let searchQuery = '';

    if (taskSearchInput) {
        taskSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderTasks();
        });
    }

    if (settingsBtn) settingsBtn.addEventListener('click', () => {
        // Load current settings
        settingsTheme.value = localStorage.getItem('theme') || 'dark';
        settingsTimer.value = localStorage.getItem('defaultTimer') || 25;
        settingsModal.style.display = 'flex';
        settingsModal.classList.add('active');
    });
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
        settingsModal.classList.remove('active');
    });
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
        localStorage.setItem('theme', settingsTheme.value);
        localStorage.setItem('defaultTimer', settingsTimer.value);
        applyTheme(settingsTheme.value);
        showToast("Settings saved!");
        settingsModal.style.display = 'none';
        settingsModal.classList.remove('active');
    });
    if (helpBtn) helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
        helpModal.classList.add('active');
    });
    if (closeHelpBtn) closeHelpBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
        helpModal.classList.remove('active');
    });

    // --- DOM GUARD: Check all required elements exist ---
    [
        forms, taskLists, focusModeBtn, focusModal, aiModal, closeModalBtn,
        focusTaskName, timerDisplay, startTimerBtn, pauseTimerBtn, resetTimerBtn,
        focusTaskList, quoteText, quoteAuthor, aiModalTitle, aiModalContent,
        aiCloseModalBtn, themeOptions, currentThemeName, exportPdfBtn, exportXlsxBtn,
        themeToggleBtn, focusTaskSelect, focusCustomMins, taskSearchInput,
        settingsBtn, settingsModal, closeSettingsBtn, settingsTheme, settingsTimer,
        saveSettingsBtn, helpBtn, helpModal, closeHelpBtn
    ].forEach((el, i) => {
        if (el === null || el === undefined) {
            alert("A required element is missing from your HTML. Please check your HTML structure and IDs. (Index: " + i + ")");
            throw new Error("Missing DOM element(s). See alert for details.");
        }
    });

    const displayRandomQuote = () => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteText.textContent = randomQuote.text;
        quoteAuthor.textContent = randomQuote.author;
    };

    renderTasks();
    displayRandomQuote();

    // --- EXPORT TO PDF FUNCTIONALITY --- //
    if (exportPdfBtn) {
        exportPdfBtn.onclick = function () {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const quadrantNames = {
                q1: 'Urgent & Important',
                q2: 'Not Urgent & Important',
                q3: 'Urgent & Not Important',
                q4: 'Not Urgent & Not Important'
            };

            // --- Cover Page ---
            doc.setFontSize(22);
            doc.text("Eisenhower Matrix Tasks", 105, 30, { align: "center" });
            doc.setFontSize(14);
            doc.text(`Exported: ${new Date().toLocaleString()}`, 105, 40, { align: "center" });
            doc.setFontSize(12);
            doc.text("Each quadrant is on a separate page.", 105, 50, { align: "center" });
            doc.addPage();

            // --- Quadrant Tables ---
            Object.keys(tasks).forEach((q, idx) => {
                if (idx > 0) doc.addPage();
                doc.setFontSize(16);
                doc.text(quadrantNames[q], 14, 18);

                const data = tasks[q].map(t => [
                    t.name,
                    t.desc || "",
                    t.time || "",
                    t.completed ? "Done" : "Pending"
                ]);

                doc.autoTable({
                    head: [["Task Name", "Description", "Time (min)", "Status"]],
                    body: data,
                    startY: 24,
                    styles: { fontSize: 11, cellPadding: 3 },
                    headStyles: { fillColor: [79, 70, 229] }, // Indigo
                    alternateRowStyles: { fillColor: [245, 245, 245] }
                });
            });

            // --- Footer with page numbers ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: "right" });
                doc.text("Eisenhower Matrix AI", 14, 290);
            }

            doc.save("eisenhower-matrix.pdf");
            showToast("PDF exported!");
        };
    }

    if (exportXlsxBtn) {
        exportXlsxBtn.onclick = function () {
            // Prepare data for each quadrant
            const quadrantNames = {
                q1: 'Urgent & Important',
                q2: 'Not Urgent & Important',
                q3: 'Urgent & Not Important',
                q4: 'Not Urgent & Not Important'
            };
            const sheets = {};

            // Each quadrant as a separate sheet
            Object.keys(tasks).forEach(q => {
                const data = [
                    ["Task Name", "Description", "Time (min)", "Status"]
                ];
                tasks[q].forEach(t => {
                    data.push([
                        t.name,
                        t.desc || "",
                        t.time || "",
                        t.completed ? "Done" : "Pending"
                    ]);
                });
                sheets[quadrantNames[q]] = XLSX.utils.aoa_to_sheet(data);
            });

            // Create workbook
            const wb = XLSX.utils.book_new();
            Object.keys(sheets).forEach(sheetName => {
                XLSX.utils.book_append_sheet(wb, sheets[sheetName], sheetName);
            });

            // Export
            XLSX.writeFile(wb, "eisenhower-matrix.xlsx");
            showToast("XLSX exported!");
        };
    }
});
