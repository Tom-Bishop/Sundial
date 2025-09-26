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
    const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
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
    const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
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
        if (word.length < 4) return false;
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
    }).slice(0, 25);
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
    // Store found words in localStorage for hidden.html
    const foundDate = new Date();
    const foundKey = `sundial_${foundDate.getFullYear()}_${foundDate.getMonth()+1}_${foundDate.getDate()}_found`;
    localStorage.setItem(foundKey, JSON.stringify(foundWords));
    // Call setFoundWord for hidden.html integration
    if (window.setFoundWord) window.setFoundWord(word);
    renderSundial();
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
    sundialLetters = getDailyLetters();
    centerLetter = sundialLetters[4];
    foundWords = [];
    // Find all valid words for today's letters
    let allValid = filterValidWords(dictionary, sundialLetters, centerLetter);
    // If not enough words, reshuffle until we get 15-25
    let tries = 0;
    while ((allValid.length < 15 || allValid.length > 25) && tries < 20) {
        sundialLetters = getDailyLetters();
        centerLetter = sundialLetters[4];
        allValid = filterValidWords(dictionary, sundialLetters, centerLetter);
        tries++;
    }
    validWords = allValid;
    renderSundial();
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
    // Create sundial layout
    const container = document.createElement('div');
    container.className = 'sundial-container';
    // Position 8 letters around center
    const isLight = document.body.classList.contains('light-mode');
    // Render 8 outer letters in a circle
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI;
        const x = 120 + 90 * Math.cos(angle);
        const y = 120 + 90 * Math.sin(angle);
        const letterDiv = document.createElement('div');
        letterDiv.className = 'sundial-letter' + (isLight ? ' light-mode' : '');
        letterDiv.style.position = 'absolute';
        letterDiv.style.left = `${x}px`;
        letterDiv.style.top = `${y}px`;
        letterDiv.textContent = sundialLetters[i];
        container.appendChild(letterDiv);
    }
    // Center letter (always sundialLetters[4])
    const centerDiv = document.createElement('div');
    centerDiv.className = 'sundial-center' + (isLight ? ' light-mode' : '');
    centerDiv.style.position = 'absolute';
    centerDiv.style.left = '50%';
    centerDiv.style.top = '50%';
    centerDiv.style.transform = 'translate(-50%, -50%)';
    centerDiv.textContent = sundialLetters[4];
    container.appendChild(centerDiv);
    container.style.position = 'relative';
    container.style.width = '240px';
    container.style.height = '240px';
    grid.appendChild(container);

    // Show found words count and list
    const foundList = document.createElement('div');
    foundList.className = 'found-words' + (isLight ? ' light-mode' : '');
    foundList.innerHTML = `<span class="word-count"><span class="word-count-icon">🔎</span> ${foundWords.length}/${validWords.length}</span><br><strong>Found Words:</strong> ` + foundWords.join(', ');
    grid.appendChild(foundList);
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