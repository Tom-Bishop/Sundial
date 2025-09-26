// Dark mode toggle logic
function setupDarkModeToggle() {
    document.body.classList.add('dark-mode');
    const appDiv = document.querySelector('.app');
    if (appDiv) appDiv.classList.add('dark-mode');
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
            if (appDiv) appDiv.classList.toggle('dark-mode');
            if (appDiv) appDiv.classList.toggle('light-mode');
            document.querySelectorAll('.sundial-letter').forEach(el => {
                el.classList.toggle('light-mode');
            });
            document.querySelectorAll('.sundial-center').forEach(el => {
                el.classList.toggle('light-mode');
            });
            document.querySelectorAll('.found-words').forEach(el => {
                el.classList.toggle('light-mode');
            });
            darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '🌙 Dark Mode' : '☀️ Light Mode';
        });
        darkModeToggle.textContent = '🌙 Dark Mode';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    setupDarkModeToggle();
    startGame();
    // Add Give Up button only once
    const main = document.querySelector('main');
    if (main && !document.getElementById('giveUpBtn')) {
        const giveUpBtn = document.createElement('button');
        giveUpBtn.id = 'giveUpBtn';
        giveUpBtn.textContent = 'Give Up / Reveal All';
        giveUpBtn.style.marginTop = '16px';
        main.appendChild(giveUpBtn);
        giveUpBtn.addEventListener('click', () => {
            alert('All possible words: ' + validWords.join(', '));
        });
    }
});
// Sundial Word Puzzle Game Logic
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let foundWords = [];
let startTime;
let timerInterval;

let sundialLetters = [];
let centerLetter = '';
let validWords = [];
let dictionary = [];

function getRandomLetters() {
    let arr = [];
    while (arr.length < 9) {
        let l = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        if (!arr.includes(l)) arr.push(l);
    }
    return arr;
}

async function loadDictionary() {
    const response = await fetch('dictionary.json');
    dictionary = await response.json();
}

function getDailyWords() {
    // Daily selection from dictionary
    const today = new Date();
    let seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    function seededShuffle(array, seed) {
        let result = array.slice();
        for (let i = result.length - 1; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            let j = Math.floor(seed / 233280 * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    return seededShuffle(dictionary, seed).slice(0, 25);
}

// Utility to check for simple plurals, abbreviations, and proper nouns
function isValidWord(word, dictionary) {
    // Exclude proper nouns (capitalized), abbreviations (contains '.'), and simple plurals (ends with 'S' but not 'SS')
    if (/[^A-Z]/.test(word)) return false;
    if (word.endsWith('S') && !word.endsWith('SS') && dictionary.includes(word.slice(0, -1))) return false;
    if (word.includes('.')) return false;
    if (word[0] === word[0].toUpperCase() && word.slice(1).toLowerCase() === word.slice(1)) return false;
    return true;
}

// Get a daily random set of 9 unique letters
function getDailyLetters() {
    const today = new Date();
    let seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    let arr = [];
    let lettersArr = LETTERS.split('');
    for (let i = lettersArr.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        let j = Math.floor(seed / 233280 * (i + 1));
        [lettersArr[i], lettersArr[j]] = [lettersArr[j], lettersArr[i]];
    }
    for (let i = 0; arr.length < 9 && i < lettersArr.length; i++) {
        arr.push(lettersArr[i]);
    }
    return arr;
}

function filterValidWords(wordList, letters, center) {
    // Only allow each letter as many times as it appears in the wheel
    return wordList.filter(word => {
        word = word.toUpperCase();
        if (!word.includes(center)) return false;
        if (word.length < 4 || word.length > 9) return false;
        let wheelCounts = {};
        for (let l of letters) wheelCounts[l] = (wheelCounts[l] || 0) + 1;
        let wordCounts = {};
        for (let c of word) {
            if (!letters.includes(c)) return false;
            wordCounts[c] = (wordCounts[c] || 0) + 1;
            if (wordCounts[c] > wheelCounts[c]) return false;
        }
        // Exclude simple plurals, abbreviations, proper nouns
        if (!isValidWord(word, dictionary)) return false;
        return true;
    });
}

function checkWord(input) {
    const word = input.value.trim().toUpperCase();
    if (word.length < 4) {
        alert('Word must be at least 4 letters.');
        return;
    }
    if (!word.includes(centerLetter)) {
        alert(`Word must include the center letter: ${centerLetter}`);
        return;
    }
    // Check letter counts
    let wheelCounts = {};
    for (let l of sundialLetters) wheelCounts[l] = (wheelCounts[l] || 0) + 1;
    let wordCounts = {};
    for (let c of word) {
        if (!sundialLetters.includes(c)) {
            alert('Word contains invalid letter.');
            return;
        }
        wordCounts[c] = (wordCounts[c] || 0) + 1;
        if (wordCounts[c] > wheelCounts[c]) {
            alert('Word uses a letter too many times.');
            return;
        }
    }
    if (!validWords.includes(word)) {
        alert('Invalid word!');
        return;
    }
    if (foundWords.includes(word)) {
        alert('Already found!');
        return;
    }
    foundWords.push(word);
    renderSundial();
    renderHiddenWords();
    input.value = '';
    if (foundWords.length === validWords.length) {
        endGame();
    }
    // Store today's valid words in localStorage for hidden.html
    const wordsDate = new Date();
    const wordsKey = `sundial_${wordsDate.getFullYear()}_${wordsDate.getMonth()+1}_${wordsDate.getDate()}`;
    localStorage.setItem(wordsKey, JSON.stringify(validWords));
}

async function startGame() {
    if (!dictionary.length) await loadDictionary();
    // Generate daily hash for consistent puzzle
    const today = new Date();
    let seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    function seededShuffle(array, seed) {
        let result = array.slice();
        for (let i = result.length - 1; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            let j = Math.floor(seed / 233280 * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    // Letters based on day hash
    let lettersArr = LETTERS.split('');
    lettersArr = seededShuffle(lettersArr, seed);
    sundialLetters = lettersArr.slice(0, 9);
    centerLetter = sundialLetters[0];
    // Words based on day hash and letters
    let filteredWords = filterValidWords(dictionary, sundialLetters, centerLetter);
    filteredWords = seededShuffle(filteredWords, seed);
    validWords = filteredWords.slice(0, 15);
    foundWords = [];
    renderSundial();
    renderHiddenWords();
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('completionModal').classList.add('hidden');
    document.getElementById('wordInput').value = '';
    document.getElementById('timer').textContent = '00:00';
}

function renderSundial() {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';
    grid.style.display = 'flex';
    grid.style.justifyContent = 'center';
    grid.style.alignItems = 'center';
    // Create sundial layout using modern structure
    const sundial = document.createElement('div');
    sundial.className = 'sundial sundial-9th';
    sundial.style.transform = 'scale(1.27)';
    // 9 cells: 8 outer, 1 center
    for (let i = 0; i < 9; i++) {
        const isCentral = i === 4;
        const cell = document.createElement('div');
        cell.setAttribute('data-letter', sundialLetters[i]);
        cell.setAttribute('data-index', i);
        cell.setAttribute('data-central', isCentral ? 'true' : 'false');
        const inner = document.createElement('div');
        inner.className = 'inner-cell';
        inner.textContent = sundialLetters[i];
        cell.appendChild(inner);
        sundial.appendChild(cell);
    }
    grid.appendChild(sundial);
}

function renderHiddenWords() {
    const list = document.getElementById('hiddenWordsList');
    if (!list) return;
    list.innerHTML = '';
    validWords.forEach(word => {
        const li = document.createElement('li');
        li.className = 'hidden-word-box';
        li.textContent = foundWords.includes(word) ? word : '???';
        list.appendChild(li);
    });
    // Update words left indicator
    const indicator = document.getElementById('wordsLeftIndicator');
    if (indicator) indicator.textContent = `${foundWords.length}/${validWords.length}`;
}

document.getElementById('submitBtn').addEventListener('click', () => {
    checkWord(document.getElementById('wordInput'));
});

document.getElementById('wordInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        checkWord(e.target);
    }
});

document.getElementById('submitScoreBtn').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    const time = document.getElementById('finalTime').textContent;
    // Save score logic here (e.g., localStorage or send to server)
    document.getElementById('completionModal').classList.add('hidden');
    startGame();
});

window.addEventListener('DOMContentLoaded', () => {
    startGame();
    // Add Give Up button only once
    const main = document.querySelector('main');
    if (main && !document.getElementById('giveUpBtn')) {
        const giveUpBtn = document.createElement('button');
        giveUpBtn.id = 'giveUpBtn';
        giveUpBtn.textContent = 'Give Up / Reveal All';
        giveUpBtn.style.marginTop = '16px';
        main.appendChild(giveUpBtn);
        giveUpBtn.addEventListener('click', () => {
            alert('All possible words: ' + validWords.join(', '));
        });
    }
});