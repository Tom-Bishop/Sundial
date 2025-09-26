// ===================== THE SUNDIAL GAME CORE ===================== //
const MAX_WORDS = 15;
const MIN_WORD_LEN = 4;

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
    const response = await fetch('words_dictionary.json');
    const dictObj = await response.json();
    dictionary = Object.keys(dictObj);
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
    if (word.length < MIN_WORD_LEN) {
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

function updateProgressIndicators(){
    const indicator = document.getElementById('wordsLeftIndicator');
    const progress = document.getElementById('progress');
    if (indicator) indicator.textContent = `${foundWords.length}/${validWords.length}`;
    if (progress) progress.textContent = `${foundWords.length}/${validWords.length}`;
}

function shuffleOuterLetters() {
    if(!sundialLetters.length) return;
    const outer = sundialLetters.slice(1);
    for (let i = outer.length -1; i>0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [outer[i], outer[j]] = [outer[j], outer[i]];
    }
    sundialLetters = [sundialLetters[0], ...outer];
    renderSundial();
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
    validWords = filteredWords.slice(0, MAX_WORDS);
    foundWords = [];
    renderSundial();
    renderHiddenWords();
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('completionModal').classList.add('hidden');
    document.getElementById('wordInput').value = '';
    document.getElementById('timer').textContent = '00:00';
    updateProgressIndicators();
}

function renderSundial() {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';
    const wheel = document.createElement('div');
    wheel.className = 'sundial-wheel';

    // Center letter is index 0 in sundialLetters
    const center = document.createElement('button');
    center.type = 'button';
    center.className = 'letter-cell center-letter';
    center.textContent = sundialLetters[0];
    center.setAttribute('aria-label', `Center letter ${sundialLetters[0]}`);
    wheel.appendChild(center);

    // Outer 8 letters arranged evenly in a circle
    const radius = 95; // px
    const cx = 120; // center x of wheel container
    const cy = 120; // center y
    for (let i = 1; i < 9; i++) {
        const angle = ((i-1) / 8) * 2 * Math.PI - Math.PI / 2; // start at top
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'letter-cell outer-letter';
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        btn.textContent = sundialLetters[i];
        btn.setAttribute('data-index', i.toString());
        wheel.appendChild(btn);
    }
    grid.appendChild(wheel);
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
    updateProgressIndicators();
}

document.getElementById('submitBtn').addEventListener('click', () => {
    checkWord(document.getElementById('wordInput'));
});

document.getElementById('wordInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { checkWord(e.target); } });

// New UI controls
document.getElementById('shuffleBtn')?.addEventListener('click', shuffleOuterLetters);
document.getElementById('clearBtn')?.addEventListener('click', () => { const inp=document.getElementById('wordInput'); if(inp){ inp.value=''; inp.focus(); }});
document.getElementById('revealBtn')?.addEventListener('click', () => {
    if(!confirm('Reveal all words? This ends the puzzle.')) return;
    foundWords = [...validWords];
    renderHiddenWords();
    updateProgressIndicators();
});
document.getElementById('shareBtn')?.addEventListener('click', () => {
    if(!validWords.length) return;
    const pct = Math.round((foundWords.length/validWords.length)*100);
    const share = `Sundial ${foundWords.length}/${validWords.length} (${pct}%) Letters: ${sundialLetters.join('')} Center:${centerLetter}`;
    navigator.clipboard.writeText(share).then(()=>{
        const btn = document.getElementById('shareBtn');
        if(btn){ btn.classList.add('flash'); setTimeout(()=>btn.classList.remove('flash'),900); }
    });
});

document.getElementById('submitScoreBtn').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    const time = document.getElementById('finalTime').textContent;
    // Save score logic here (e.g., localStorage or send to server)
    document.getElementById('completionModal').classList.add('hidden');
    startGame();
});

// Remove legacy duplicate DOMContentLoaded listener at end (integrated above)