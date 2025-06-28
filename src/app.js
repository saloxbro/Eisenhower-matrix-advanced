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
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

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
            if (tasks[quadrantId].length === 0) {
                list.innerHTML = `<li class="task-item empty">No tasks yet.</li>`;
            } else {
                tasks[quadrantId].forEach(task => {
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
        const timeInput = form.querySelector('.time-input');
        const quadrantId = form.dataset.quadrant;
        const taskName = taskInput.value.trim();
        if (!taskName) return;
        addTask(taskName, quadrantId, timeInput ? timeInput.value.trim() : null);
        form.reset();
    };

    const addTask = (name, quadrantId, time = null) => {
        const newTask = {
            id: generateId(), name, quadrant: quadrantId,
            time: time ? parseInt(time, 10) : null, completed: false,
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
    const updateTimerDisplay = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        if (isTimerRunning || !currentFocusTask) return;
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                stopTimer();
                toggleTaskCompletion(currentFocusTask.id, currentFocusTask.quadrant);
                renderFocusTasks();
            }
        }, 1000);
    };

    const pauseTimer = () => { isTimerRunning = false; clearInterval(timerInterval); };
    const resetTimer = () => { pauseTimer(); timeLeft = 25 * 60; updateTimerDisplay(); };
    const stopTimer = () => { pauseTimer(); };

    const renderFocusTasks = () => {
        focusTaskList.innerHTML = '';
        const importantTasks = tasks.q1.filter(t => !t.completed);

        if (importantTasks.length === 0) {
            focusTaskName.textContent = 'All done! Great work!';
            if (currentFocusTask) currentFocusTask = null;
            resetTimer();
            return;
        }

        // If current focus task is completed or gone, select the next one
        if (!currentFocusTask || importantTasks.every(t => t.id !== currentFocusTask.id)) {
            setFocusTask(importantTasks[0]);
        }

        importantTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            if (currentFocusTask && task.id === currentFocusTask.id) {
                taskElement.style.cssText = "border-color: var(--primary); transform: scale(1.02);";
            }
            taskElement.innerHTML = `<span>${task.name}</span>`;
            taskElement.addEventListener('click', () => setFocusTask(task));
            focusTaskList.appendChild(taskElement);
        });
    };

    const setFocusTask = (task) => {
        currentFocusTask = task;
        focusTaskName.textContent = task.name;
        resetTimer();
        renderFocusTasks();
    };

    const openFocusModal = () => { focusModal.style.display = 'flex'; focusModal.classList.add('active'); renderFocusTasks(); };
    const closeFocusModal = () => { focusModal.style.display = 'none'; focusModal.classList.remove('active'); pauseTimer(); };

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

    // --- INITIALIZATION & EVENT LISTENERS --- //
    forms.forEach(form => form.addEventListener('submit', handleAddTask));
    taskLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('drop', handleDrop);
        list.addEventListener('dragend', handleDragEnd);
    });

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    focusModeBtn.addEventListener('click', openFocusModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFocusModal);
    if (startTimerBtn) startTimerBtn.addEventListener('click', startTimer);
    if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', pauseTimer);
    if (resetTimerBtn) resetTimerBtn.addEventListener('click', resetTimer);

    aiSuggestBtns.forEach(btn => btn.addEventListener('click', () => handleAiSuggest(btn.dataset.quadrant)));
    if (aiCloseModalBtn) aiCloseModalBtn.addEventListener('click', closeAiModal);

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
            const doc = new window.jspdf.jsPDF();
            doc.setFontSize(16);
            doc.text("Eisenhower Matrix Tasks", 10, 10);

            ['q1', 'q2', 'q3', 'q4'].forEach((q, i) => {
                const quadrantTasks = tasks[q];
                const quadrantName = { q1: 'Urgent & Important', q2: 'Not Urgent & Important', q3: 'Urgent & Not Important', q4: 'Not Urgent & Not Important' }[q];
                doc.setFontSize(12);
                doc.text(`${quadrantName}:`, 10, 20 + i * 40);
                quadrantTasks.forEach((t, idx) => {
                    doc.text(`- ${t.name} (${t.time || 0} min) [${t.completed ? 'Done' : 'Pending'}]`, 12, 26 + i * 40 + idx * 6);
                });
            });

            doc.save("eisenhower-matrix.pdf");
        };
    }
});
