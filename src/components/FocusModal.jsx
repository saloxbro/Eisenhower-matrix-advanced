import React, { useState, useEffect, useRef } from 'react';

const QUADRANT_LABELS = {
    q1: "Urgent & Important",
    q2: "Not Urgent & Important",
    q3: "Urgent & Not Important",
    q4: "Not Urgent & Not Important",
    custom: "Custom Task"
};

const FocusModal = ({ isOpen, onClose, tasksByQuadrant, onTaskComplete }) => {
    const [selectedQuadrant, setSelectedQuadrant] = useState('q1');
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [customTask, setCustomTask] = useState({ name: '', time: 25 });
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const intervalRef = useRef(null);

    // Get tasks for the selected quadrant
    const tasks = selectedQuadrant === 'custom'
        ? []
        : (tasksByQuadrant[selectedQuadrant] || []);

    // When modal opens or quadrant changes, set default task
    useEffect(() => {
        if (isOpen) {
            if (selectedQuadrant === 'custom') {
                setSelectedTaskId('');
                setTimeLeft(customTask.time * 60);
            } else if (tasks.length > 0) {
                setSelectedTaskId(tasks[0].id);
                setTimeLeft((tasks[0].time || 25) * 60);
            } else {
                setSelectedTaskId('');
                setTimeLeft(0);
            }
            setIsTimerRunning(false);
            clearInterval(intervalRef.current);
        }
        // eslint-disable-next-line
    }, [isOpen, selectedQuadrant, tasks.length]);

    // When selected task changes, update timer
    useEffect(() => {
        if (selectedQuadrant === 'custom') {
            setTimeLeft(customTask.time * 60);
        } else {
            const task = tasks.find(t => t.id === selectedTaskId);
            setTimeLeft((task?.time || 25) * 60);
        }
        setIsTimerRunning(false);
        clearInterval(intervalRef.current);
        // eslint-disable-next-line
    }, [selectedTaskId]);

    // Timer logic
    useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    setIsTimerRunning(false);
                    if (onTaskComplete && selectedTaskId && selectedQuadrant !== 'custom') {
                        onTaskComplete(selectedTaskId, selectedQuadrant);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [isTimerRunning, timeLeft, selectedTaskId, selectedQuadrant, onTaskComplete]);

    const handleStart = () => {
        if (!isTimerRunning && timeLeft > 0) setIsTimerRunning(true);
    };

    const handlePause = () => {
        setIsTimerRunning(false);
        clearInterval(intervalRef.current);
    };

    const handleReset = () => {
        if (selectedQuadrant === 'custom') {
            setTimeLeft(customTask.time * 60);
        } else {
            const task = tasks.find(t => t.id === selectedTaskId);
            setTimeLeft((task?.time || 25) * 60);
        }
        setIsTimerRunning(false);
        clearInterval(intervalRef.current);
    };

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    const selectedTask = selectedQuadrant === 'custom'
        ? customTask
        : tasks.find(t => t.id === selectedTaskId);

    return (
        <div className="modal-overlay open">
            <div className="modal-content" style={{ maxWidth: 420 }}>
                <button className="close-btn" onClick={() => { handlePause(); onClose(); }}>&times;</button>
                <h2 style={{ marginBottom: 20 }}>Focus Mode</h2>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 600, marginRight: 8 }}>Quadrant:</label>
                    <select
                        value={selectedQuadrant}
                        onChange={e => setSelectedQuadrant(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                            fontSize: '1rem'
                        }}
                    >
                        {Object.entries(QUADRANT_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {selectedQuadrant === 'custom' ? (
                    <div style={{ marginBottom: 16 }}>
                        <input
                            type="text"
                            placeholder="Custom task name"
                            value={customTask.name}
                            onChange={e => setCustomTask({ ...customTask, name: e.target.value })}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                fontSize: '1rem',
                                marginRight: 8
                            }}
                        />
                        <input
                            type="number"
                            min={1}
                            placeholder="Mins"
                            value={customTask.time}
                            onChange={e => setCustomTask({ ...customTask, time: Number(e.target.value) })}
                            style={{
                                width: 70,
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                ) : (
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="task-select" style={{ fontWeight: 600 }}>Select Task:</label>
                        <select
                            id="task-select"
                            value={selectedTaskId}
                            onChange={e => setSelectedTaskId(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                fontSize: '1rem',
                                marginLeft: 10
                            }}
                        >
                            {tasks.length === 0 && <option>No tasks</option>}
                            {tasks.map(task => (
                                <option key={task.id} value={task.id}>
                                    {task.name} {task.time ? `(${task.time} min)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ fontSize: 17, fontWeight: 'bold', marginBottom: 10 }}>
                    {selectedTask?.name || ''}
                    {selectedTask?.time && (
                        <span style={{ color: '#10b981', marginLeft: 8 }}>
                            ({selectedTask.time} min)
                        </span>
                    )}
                </div>

                <div className="timer-display">{formatTime(timeLeft)}</div>

                <div className="timer-controls">
                    <button onClick={handleStart} disabled={isTimerRunning || timeLeft === 0}>Start</button>
                    <button onClick={handlePause} disabled={!isTimerRunning}>Pause</button>
                    <button onClick={handleReset}>Reset</button>
                </div>
            </div>
        </div>
    );
};

export default FocusModal;
