import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onToggleTaskCompletion, onDeleteTask }) => {
    return (
        <ul className="task-list">
            {tasks.length === 0 ? (
                <li className="task-item empty">No tasks available</li>
            ) : (
                tasks.map(task => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onToggleCompletion={onToggleTaskCompletion}
                        onDelete={onDeleteTask}
                    />
                ))
            )}
        </ul>
    );
};

export default TaskList;