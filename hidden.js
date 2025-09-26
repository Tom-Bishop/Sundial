// hidden.js - Handles hidden words display and reveal logic

// This should be set from main.js or a shared state, but for demo, we use localStorage
function getTodayKey() {
    const today = new Date();
    return `sundial_${today.getFullYear()}_${today.getMonth()+1}_${today.getDate()}`;
}

function getHiddenWords() {
    // Try to get from localStorage (set by main.js when puzzle is generated)
    const key = getTodayKey();
    const words = localStorage.getItem(key);
    if (words) return JSON.parse(words);
    // fallback: demo words
    return ["CLOCK", "CLOAK", "COCK", "COAL", "LOCAL", "CALL", "LOCK", "COLA", "LACK", "COCKTAIL", "TACK", "TALK", "COAT", "CAT", "ACT", "OCTAL", "ALT", "LAT", "LOT", "OAT", "TOC", "TACKLE"];
}

function getFoundWords() {
    // Try to get from localStorage (set by main.js when player finds a word)
    const key = getTodayKey() + '_found';
    const words = localStorage.getItem(key);
    if (words) return JSON.parse(words);
    return [];
}

function setFoundWord(word) {
    const key = getTodayKey() + '_found';
    let found = getFoundWords();
    if (!found.includes(word)) found.push(word);
    localStorage.setItem(key, JSON.stringify(found));
}

function renderHiddenWords() {
    const allWords = getHiddenWords().sort();
    const found = getFoundWords();
    const list = document.getElementById('hiddenWordsList');
    list.innerHTML = '';
    allWords.forEach(word => {
        const li = document.createElement('li');
        li.className = 'hidden-word-box';
        li.textContent = found.includes(word) ? word : '????';
        list.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', renderHiddenWords);

document.getElementById('revealWordsBtn').addEventListener('click', function() {
    const allWords = getHiddenWords().sort();
    const list = document.getElementById('hiddenWordsList');
    list.innerHTML = '';
    allWords.forEach(word => {
        const li = document.createElement('li');
        li.className = 'hidden-word-box';
        li.textContent = word;
        list.appendChild(li);
    });
});

// For demo: expose setFoundWord globally
window.setFoundWord = setFoundWord;
