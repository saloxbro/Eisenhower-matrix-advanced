import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Header from './components/Header.jsx';
import Matrix from './components/Matrix.jsx';
import FocusModal from './components/FocusModal.jsx';

const initialTasks = {
    q1: [],
    q2: [],
    q3: [],
    q4: [],
};

const App = () => {
    const [tasks, setTasks] = useState(initialTasks);
    const [focusModeOpen, setFocusModeOpen] = useState(false);
    const [theme, setTheme] = useState('light');

    const addTask = (task) => {
        setTasks(prev => ({
            ...prev,
            [task.quadrant]: [...prev[task.quadrant], task],
        }));
    };

    const deleteTask = (id, quadrant) => {
        setTasks(prev => ({
            ...prev,
            [quadrant]: prev[quadrant].filter(task => task.id !== id),
        }));
    };

    const toggleTaskCompletion = (id, quadrant) => {
        setTasks(prev => ({
            ...prev,
            [quadrant]: prev[quadrant].map(task =>
                task.id === id ? { ...task, completed: !task.completed } : task
            ),
        }));
    };

    const toggleTheme = () => {
        setTheme(t => t === 'light' ? 'dark' : 'light');
        document.documentElement.setAttribute(
            'data-theme',
            theme === 'light' ? 'dark' : 'light'
        );
    };

    const openFocusMode = () => setFocusModeOpen(true);
    const closeFocusMode = () => setFocusModeOpen(false);

    return (
        <div>
            <Header
                onFocusModeToggle={openFocusMode}
                isDarkTheme={theme === 'dark'}
                onThemeToggle={toggleTheme}
                tasksByQuadrant={tasks}
            />
            <Matrix
                tasks={tasks}
                addTask={addTask}
                deleteTask={deleteTask}
                toggleTaskCompletion={toggleTaskCompletion}
            />
            <FocusModal
                isOpen={focusModeOpen}
                onClose={closeFocusMode}
                tasksByQuadrant={tasks}
                onTaskComplete={() => {}}
            />
        </div>
    );
};

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);

export default App;