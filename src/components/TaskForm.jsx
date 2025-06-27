import React, { useState } from 'react';

const TaskForm = ({ quadrantId, onAddTask }) => {
    const [taskName, setTaskName] = useState('');
    const [taskTime, setTaskTime] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskName) return;

        const newTask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: taskName,
            time: taskTime ? parseInt(taskTime, 10) : null,
            completed: false,
            quadrant: quadrantId,
        };

        onAddTask(newTask);
        setTaskName('');
        setTaskTime('');
    };

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <input
                type="text"
                className="task-input"
                placeholder="Add a new task..."
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
            />
            <input
                type="number"
                className="time-input"
                placeholder="Mins"
                min="1"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
            />
            <button type="submit" className="add-task-btn">
                <i className="fas fa-plus"></i> Add
            </button>
        </form>
    );
};

export default TaskForm;