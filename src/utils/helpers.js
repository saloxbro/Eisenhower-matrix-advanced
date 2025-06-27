// filepath: /eisenhower-matrix-advanced/eisenhower-matrix-advanced/src/utils/helpers.js

export const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const getFromLocalStorage = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

export const removeFromLocalStorage = (key) => {
    localStorage.removeItem(key);
};

export const updateLocalStorage = (key, updateFunction) => {
    const data = getFromLocalStorage(key);
    if (data) {
        const updatedData = updateFunction(data);
        saveToLocalStorage(key, updatedData);
    }
};

export const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};