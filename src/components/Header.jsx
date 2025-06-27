import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye,
  faMoon,
  faSun,
  faFileExport,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Header = ({ onFocusModeToggle, isDarkTheme, onThemeToggle, onClearAllTasks, tasksByQuadrant }) => {
  const exportPDF = () => {
    const matrix = document.querySelector('.matrix-container');
    if (!matrix) return;

    html2canvas(matrix).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('eisenhower-matrix.pdf');
    });
  };

  const exportXLSX = () => {
    const allTasks = [];
    Object.entries(tasksByQuadrant).forEach(([quadrant, tasks]) => {
      tasks.forEach(task => {
        allTasks.push({
          Quadrant: quadrant,
          Name: task.name,
          Time: task.time,
          Completed: task.completed ? 'Yes' : 'No'
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(allTasks);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "eisenhower-matrix.xlsx");
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <h1 className="title">Eisenhower Matrix</h1>
        </div>
        <div className="controls">
          <button onClick={onFocusModeToggle} className="control-btn" title="Start Focus Timer">
            <FontAwesomeIcon icon={faBullseye} /> Focus Mode
          </button>

          <button onClick={onThemeToggle} className="control-btn" title="Toggle Light/Dark Theme">
            <FontAwesomeIcon icon={isDarkTheme ? faSun : faMoon} />
          </button>

          <button onClick={exportPDF} className="control-btn" title="Download Matrix as PDF">
            <FontAwesomeIcon icon={faFileExport} /> Export PDF
          </button>

          <button onClick={onClearAllTasks} className="control-btn" title="Clear All Tasks">
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>

          <button onClick={exportXLSX} className="control-btn" title="Download Matrix as XLSX">
            <i className="fas fa-file-excel"></i> Export XLSX
          </button>
        </div>
      </div>

      <div id="quote-container" className="quote-container">
        <p>
          "<span id="quote-text">
            The key is not to prioritize what's on your schedule, but to schedule your priorities.
          </span>" – <span id="quote-author">Stephen Covey</span>
        </p>
      </div>
    </header>
  );
};

export default Header;
