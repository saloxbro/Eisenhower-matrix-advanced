import React, { useState } from 'react';
import Header from './components/Header';
import Matrix from './components/Matrix';
import FocusModal from './components/FocusModal';

const initialTasks = {
  q1: [],
  q2: [],
  q3: [],
  q4: []
};

const App = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  const addTask = (task) => {
    setTasks((prev) => ({
      ...prev,
      [task.quadrant]: [...prev[task.quadrant], task]
    }));
  };

  const deleteTask = (id, quadrant) => {
    setTasks((prev) => ({
      ...prev,
      [quadrant]: prev[quadrant].filter((task) => task.id !== id)
    }));
  };

  const toggleTaskCompletion = (id, quadrant) => {
    setTasks((prev) => ({
      ...prev,
      [quadrant]: prev[quadrant].map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const openFocusMode = () => setFocusModeOpen(true);
  const closeFocusMode = () => setFocusModeOpen(false);

  const clearAllTasks = () => {
    if (window.confirm('Are you sure you want to clear all tasks from all quadrants?')) {
      setTasks(initialTasks);
    }
  };

  return (
    <div>
      <Header
        onFocusModeToggle={openFocusMode}
        isDarkTheme={theme === 'dark'}
        onThemeToggle={toggleTheme}
        onClearAllTasks={clearAllTasks}
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
        tasks={tasks.q1}
        onTaskComplete={(id) => {
          deleteTask(id, 'q1');
        }}
      />
    </div>
  );
};

export default App;
