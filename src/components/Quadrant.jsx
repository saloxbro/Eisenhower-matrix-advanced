import React from 'react';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

const Quadrant = ({
    title,
    subtitle,
    tasks,
    onAddTask,
    onDeleteTask,
    onToggleTaskCompletion,
    quadrantId
}) => {
    return (
        <div className={`quadrant`} id={quadrantId}>
            <div className="quadrant-header">
                <h2>{title}</h2>
                <span className="quadrant-subtitle">{subtitle}</span>
            </div>
            <TaskForm onAddTask={onAddTask} quadrantId={quadrantId} />
            <TaskList
                tasks={tasks}
                onToggleTaskCompletion={id => onToggleTaskCompletion(id, quadrantId)}
                onDeleteTask={id => onDeleteTask(id, quadrantId)}
            />
            <div className="quadrant-footer">
                <span>Total Tasks: {tasks.length}</span>
            </div>
        </div>
    );
};

export default Quadrant;