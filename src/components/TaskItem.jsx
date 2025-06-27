import React from 'react';

const TaskItem = ({ task, onToggleCompletion, onDelete }) => {
    return (
        <li className={`task-item ${task.completed ? 'completed' : ''}`}>
            <div className="task-details">
                <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={task.completed}
                    onChange={() => onToggleCompletion(task.id)}
                />
                <span className="task-name">{task.name}</span>
            </div>
            <div className="task-meta">
                {task.time && <span className="task-time"><i className="far fa-clock"></i> {task.time} min</span>}
                <div className="task-actions">
                    <button className="delete-task-btn" onClick={() => onDelete(task.id)}>
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        </li>
    );
};

export default TaskItem;