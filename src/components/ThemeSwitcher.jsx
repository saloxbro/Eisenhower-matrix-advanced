import React from 'react';

const ThemeSwitcher = ({ currentTheme, toggleTheme }) => {
    return (
        <button onClick={toggleTheme} className="theme-switcher">
            {currentTheme === 'dark' ? (
                <span>
                    <i className="fas fa-sun"></i> Light Mode
                </span>
            ) : (
                <span>
                    <i className="fas fa-moon"></i> Dark Mode
                </span>
            )}
        </button>
    );
};

export default ThemeSwitcher;