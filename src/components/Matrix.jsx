import React from "react";
import Quadrant from "./Quadrant.jsx";
// import "./Matrix.css"; // REMOVE if file does not exist

const Matrix = ({ tasks, addTask, deleteTask, toggleTaskCompletion }) => (
  <div className="matrix-container">
    <Quadrant
      title="Urgent & Important"
      subtitle="Do First"
      tasks={tasks.q1}
      onAddTask={addTask}
      onDeleteTask={id => deleteTask(id, "q1")}
      onToggleTaskCompletion={id => toggleTaskCompletion(id, "q1")}
      quadrantId="q1"
    />
    <Quadrant
      title="Not Urgent & Important"
      subtitle="Schedule"
      tasks={tasks.q2}
      onAddTask={addTask}
      onDeleteTask={id => deleteTask(id, "q2")}
      onToggleTaskCompletion={id => toggleTaskCompletion(id, "q2")}
      quadrantId="q2"
    />
    <Quadrant
      title="Urgent & Not Important"
      subtitle="Delegate"
      tasks={tasks.q3}
      onAddTask={addTask}
      onDeleteTask={id => deleteTask(id, "q3")}
      onToggleTaskCompletion={id => toggleTaskCompletion(id, "q3")}
      quadrantId="q3"
    />
    <Quadrant
      title="Not Urgent & Not Important"
      subtitle="Eliminate"
      tasks={tasks.q4}
      onAddTask={addTask}
      onDeleteTask={id => deleteTask(id, "q4")}
      onToggleTaskCompletion={id => toggleTaskCompletion(id, "q4")}
      quadrantId="q4"
    />
  </div>
);

export default Matrix;