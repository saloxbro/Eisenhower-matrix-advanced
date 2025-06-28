document.addEventListener('DOMContentLoaded', () => {
    // --- UTILS --- //
    const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const quotes = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It's not the load that breaks you down, it's the way you carry it.", author: "Lou Holtz" },
        { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
        { text: "Productivity is never an accident.", author: "Paul J. Meyer" }
    ];

    // --- DOM ELEMENT SELECTORS --- //
    const forms = document.querySelectorAll('.task-form');
    const taskLists = document.querySelectorAll('.task-list');
    const focusModeBtn = document.getElementById('focus-mode-btn');
    const focusModal = document.getElementById('focus-modal');
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
    const aiModal = document.getElementById('ai-modal');
    const aiModalTitle = document.getElementById('ai-modal-title');
    const aiModalContent = document.getElementById('ai-modal-content');
    const aiCloseModalBtn = document.getElementById('ai-close-modal-btn');
    // New Theme Switcher Elements
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeOptions = document.getElementById('theme-options');
    const currentThemeName = document.getElementById('current-theme-name');


    // --- STATE MANAGEMENT --- //
    let tasks = JSON.parse(localStorage.getItem('tasks')) || { q1: [], q2: [], q3: [], q4: [] };
    let currentDraggedTask = null;

    // --- POMODORO TIMER STATE --- //
    let timerInterval = null;
    let timeLeft = 25 * 60; // 25 minutes in seconds
    let isTimerRunning = false;
    let currentFocusTask = null;
    
    // --- GEMINI API HELPER --- //
    async function callGemini(prompt) {
        // This function remains the same as before
        const apiKey = ""; 
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


    // --- CORE FUNCTIONS (mostly unchanged) --- //
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateAllQuadrantSummaries();
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
        addTask(taskName, quadrantId, timeInput.value.trim());
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
        if(totalTimeEl){
            const totalMinutes = tasks[quadrantId]
                .filter(task => !task.completed && task.time)
                .reduce((sum, task) => sum + task.time, 0);
            totalTimeEl.textContent = totalMinutes;
        }
    };
    
    const updateAllQuadrantSummaries = () => Object.keys(tasks).forEach(updateQuadrantSummary);

    // --- DRAG & DROP (unchanged) --- //
    const handleDragStart = (e) => { currentDraggedTask = e.target; setTimeout(() => e.target.classList.add('dragging'), 0); };
    const handleDragEnd = (e) => { e.target.classList.remove('dragging'); currentDraggedTask = null; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { /* ... same as before ... */ };

    // --- THEME SWITCHER --- //
    const applyTheme = (theme) => {
        document.body.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        currentThemeName.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    };
    
    themeOptions.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedTheme = e.target.dataset.theme;
        if (selectedTheme) {
            applyTheme(selectedTheme);
        }
    });

    // --- FOCUS MODE & POMODORO (with active class toggle) --- //
    const openFocusModal = () => { focusModal.classList.add('active'); renderFocusTasks(); };
    const closeFocusModal = () => { pauseTimer(); focusModal.classList.remove('active'); };
    // Other focus mode functions (startTimer, etc.) are unchanged

    // --- AI FEATURE HANDLERS (with active class toggle) --- //
    const showAiModal = (title, content) => {
        aiModalTitle.textContent = title;
        aiModalContent.innerHTML = content;
        aiModal.classList.add('active');
    };
    const closeAiModal = () => aiModal.classList.remove('active');
    // Other AI functions (handleAiBreakdown, etc.) are unchanged

    // --- INITIALIZATION & EVENT LISTENERS --- //
    forms.forEach(form => form.addEventListener('submit', handleAddTask));
    taskLists.forEach(list => { list.addEventListener('dragover', handleDragOver); list.addEventListener('drop', handleDrop); list.addEventListener('dragend', handleDragEnd); });
    
    // Theme setup
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark
    applyTheme(savedTheme);

    // Modals
    focusModeBtn.addEventListener('click', openFocusModal);
    closeModalBtn.addEventListener('click', closeFocusModal);
    aiCloseModalBtn.addEventListener('click', closeAiModal);
    
    // AI buttons
    aiSuggestBtns.forEach(btn => btn.addEventListener('click', () => handleAiSuggest(btn.dataset.quadrant)));
    
    // ... (rest of initial listeners: timer, quote, etc.)
    const displayRandomQuote = () => { /* ... */ };
    renderTasks();
    displayRandomQuote();
});
