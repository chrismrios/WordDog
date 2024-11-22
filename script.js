// Define the game parameters
let maxAttempts = 6;
let wordLength = 6;
let currentGuess = "";
let currentRow = 0;
let gameActive = true;
let questionCount = 0;
const maxQuestions = 20;
let godModeSequence = "";
const godModeCode = "idbfg";
let godModeActive = false;

// Initialize the game
const grid = document.getElementById("grid");
const keyboardDiv = document.getElementById("keyboard");
const messageDiv = document.getElementById("message");
const restartButton = document.getElementById("restart");
const wordLengthSelector = document.getElementById("word-length-selector");
const themeSwitch = document.getElementById("theme-switch");
const styleSelector = document.getElementById("style-selector");

// Hint Bot elements
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatWindow = document.getElementById("chat-window");
const chatCounter = document.getElementById("chat-counter");
const chatContainer = document.getElementById("chat-container");
const chatToggleButton = document.getElementById("chat-toggle-button");

// Fetch a list of words and start the game
let validWords = [];
let targetWord = "";

// Store API responses for God Mode
let apiResponses = [];

// New variable to track clues already given
let givenClues = [];

// Fetch word list and start game
function fetchWords() {
  // Using Datamuse API to fetch words matching the pattern
  const apiUrl = `https://api.datamuse.com/words?sp=${'?'.repeat(wordLength)}&max=1000`;
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Store API response for God Mode
      apiResponses.push({ api: 'Datamuse Word List', response: data });
      validWords = data
        .filter(item => new RegExp(`^[a-zA-Z]{${wordLength}}$`).test(item.word))
        .map(item => item.word.toUpperCase());
      startGame();
    })
    .catch(error => {
      console.error('Error fetching word list:', error);
      // Fallback word list
      validWords = ["PLAN", "CODE", "TEST", "GAME", "WORD", "PLAY"];
      startGame();
    });
}

function startGame() {
  // Randomly select a target word from the valid words
  targetWord = validWords[Math.floor(Math.random() * validWords.length)].toUpperCase();

  // Initialize the grid
  grid.innerHTML = "";
  const totalCells = maxAttempts * wordLength;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    grid.appendChild(cell);
  }

  // Adjust grid columns
  grid.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;

  // Update CSS variables for responsive design
  document.documentElement.style.setProperty('--word-length', wordLength);

  // Initialize the keyboard
  keyboardDiv.innerHTML = "";
  const keysLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  for (let row of keysLayout) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    for (let key of row) {
      const keyDiv = document.createElement('div');
      keyDiv.className = 'key';
      keyDiv.dataset.key = key;

      if (key === 'BACKSPACE') {
        keyDiv.innerHTML = '<i class="bi bi-backspace"></i>';
        keyDiv.classList.add('special-key');
      } else if (key === 'ENTER') {
        keyDiv.textContent = 'ENTER';
        keyDiv.classList.add('special-key');
      } else {
        keyDiv.textContent = key;
      }

      keyDiv.addEventListener('click', handleLetterClick);
      rowDiv.appendChild(keyDiv);
    }
    keyboardDiv.appendChild(rowDiv);
  }

  // Reset variables
  currentGuess = "";
  currentRow = 0;
  gameActive = true;
  messageDiv.textContent = "";
  godModeSequence = "";
  godModeActive = false;
  apiResponses = [];
  givenClues = [];

  // Add event listeners for keyboard input using capture phase
  document.addEventListener("keydown", handleKeyDown, true);

  // Reset Hint Bot
  chatWindow.innerHTML = "";
  questionCount = 0;
  updateChatCounter();

  // Adjust chat window height to match grid
  adjustChatWindowHeight();

  // Apply current style
  applyStyle(styleSelector.value);

  // Ensure dark mode is applied
  applyDarkMode();

  // Hide chat container on small screens
  if (window.innerWidth <= 600) {
    chatContainer.classList.add('hidden');
    chatToggleButton.innerHTML = '<i class="bi bi-chat-dots"></i> Open Hint Bot';
  } else {
    chatContainer.classList.remove('hidden');
  }
}

function adjustChatWindowHeight() {
  const gridHeight = grid.offsetHeight;
  chatContainer.style.maxHeight = gridHeight + "px";
}

function handleLetterClick(event) {
  if (!gameActive) return;

  const key = event.target.dataset.key;

  if (key === 'BACKSPACE') {
    removeLetter();
  } else if (key === 'ENTER') {
    submitGuess();
  } else if (/^[A-Z]$/.test(key)) {
    addLetter(key);
  }
}

function handleKeyDown(event) {
    // God Mode sequence detection
    if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
      godModeSequence += event.key.toLowerCase();
  
      // Trim to match the length of the God Mode code
      if (godModeSequence.length > godModeCode.length) {
        godModeSequence = godModeSequence.slice(-godModeCode.length);
      }
  
      // Check if God Mode code matches
      if (godModeSequence === godModeCode) {
        console.log("God Mode Activated!");
        godModeSequence = ""; // Reset sequence after activation
        if (!godModeActive) {
          showGodMode();
        }
      }
    }
  
    // Check if the focused element is an input or textarea
    const activeElement = document.activeElement;
    const isInputField =
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.isContentEditable;
  
    if (isInputField) {
      // Do not process keydown events if an input field is focused
      return;
    }
  
    if (!gameActive) return;
  
    const key = event.key.toUpperCase();
  
    if (key === "BACKSPACE") {
      event.preventDefault(); // Prevent default backspace behavior
      removeLetter();
    } else if (key === "ENTER") {
      event.preventDefault(); // Prevent default enter behavior
      submitGuess();
    } else if (/^[A-Z]$/.test(key)) {
      event.preventDefault(); // Prevent default behavior for letters
      addLetter(key);
    }
  }

function addLetter(letter) {
  if (currentGuess.length < wordLength) {
    currentGuess += letter;
    updateGrid();
  }
}

function removeLetter() {
  if (currentGuess.length > 0) {
    currentGuess = currentGuess.slice(0, -1);
    updateGrid();
  }
}

function updateGrid() {
  const start = currentRow * wordLength;
  for (let i = 0; i < wordLength; i++) {
    const cell = grid.children[start + i];
    cell.textContent = currentGuess[i] || "";
    cell.classList.remove('correct', 'present', 'absent');
  }
}

function submitGuess() {
  if (!gameActive) return;

  if (currentGuess.length < wordLength) {
    showMessage(`Please enter ${wordLength} letters.`);
    return;
  }

  validateWord(currentGuess)
    .then(isValid => {
      if (!isValid) {
        showMessage("Invalid word. Try again.", true);
        shakeRow(currentRow);
        // Do not reset current guess to allow backspace
        return;
      }
      checkGuess();
    })
    .catch(error => {
      console.error('Error during word validation:', error);
      showMessage("Error validating word. Please try again.");
    });
}

function validateWord(word) {
  // Using Datamuse API to validate the word
  const apiUrl = `https://api.datamuse.com/words?sp=${word.toLowerCase()}&max=1`;

  return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Store API response for God Mode
      apiResponses.push({ api: 'Datamuse Word Validation', response: data });
      // Check if the word exists in the API response
      return data.some(item => item.word.toLowerCase() === word.toLowerCase());
    })
    .catch(error => {
      console.error('Error validating word:', error);
      return false; // Treat as invalid if there's an error
    });
}

function checkGuess() {
  const start = currentRow * wordLength;
  let guessArray = currentGuess.split("");
  let targetArray = targetWord.split("");

  // Arrays to hold the status of each letter
  const letterStatus = Array(wordLength).fill("absent");

  // First pass: correct letters in correct positions
  for (let i = 0; i < wordLength; i++) {
    if (guessArray[i] === targetArray[i]) {
      letterStatus[i] = "correct";
      targetArray[i] = null;
      guessArray[i] = null;
    }
  }

  // Second pass: correct letters in wrong positions
  for (let i = 0; i < wordLength; i++) {
    if (guessArray[i]) {
      const index = targetArray.indexOf(guessArray[i]);
      if (index !== -1) {
        letterStatus[i] = "present";
        targetArray[index] = null;
      }
    }
  }

  // Update the grid and keyboard based on the letterStatus
  for (let i = 0; i < wordLength; i++) {
    const cell = grid.children[start + i];
    cell.classList.add(letterStatus[i]);
    animateCell(cell);
    updateKeyboard(currentGuess[i], letterStatus[i]);
  }

  // Check for win condition
  if (currentGuess === targetWord) {
    showMessage("🎉 Congratulations! You guessed the word!");
    gameActive = false;
    endGame(true);
    return;
  }

  currentRow++;
  if (currentRow === maxAttempts) {
    showMessage(`Game Over! The word was ${targetWord}.`);
    gameActive = false;
    endGame(false);
    return;
  }

  resetCurrentGuess();
}

function animateCell(cell) {
  cell.style.transform = 'scale(1.1)';
  setTimeout(() => {
    cell.style.transform = 'scale(1)';
  }, 100);
}

function shakeRow(rowIndex) {
  const start = rowIndex * wordLength;
  for (let i = 0; i < wordLength; i++) {
    const cell = grid.children[start + i];
    cell.classList.add('shake');
    cell.addEventListener('animationend', () => {
      cell.classList.remove('shake');
    }, { once: true });
  }
}

function updateKeyboard(letter, status) {
  const keys = document.getElementsByClassName("key");
  for (let keyDiv of keys) {
    if (keyDiv.dataset.key.toUpperCase() === letter.toUpperCase()) {
      if (status === "correct") {
        keyDiv.classList.remove("present-key", "absent-key");
        keyDiv.classList.add("correct-key");
      } else if (status === "present" && !keyDiv.classList.contains("correct-key")) {
        keyDiv.classList.remove("absent-key");
        keyDiv.classList.add("present-key");
      } else if (
        status === "absent" &&
        !keyDiv.classList.contains("correct-key") &&
        !keyDiv.classList.contains("present-key")
      ) {
        keyDiv.classList.add("absent-key");
      }
    }
  }
}

function resetCurrentGuess() {
  currentGuess = "";
}

function showMessage(text, isError = false) {
  messageDiv.textContent = text;
  if (isError) {
    messageDiv.style.color = 'orange';
  } else {
    messageDiv.style.color = 'var(--message-color)';
  }
}

restartButton.addEventListener("click", () => {
  fetchWords();
});

// Hint Bot Functionality

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!gameActive && !godModeActive) return;

  if (questionCount >= maxQuestions) {
    alert("You have reached the maximum number of questions.");
    return;
  }

  const userMessage = chatInput.value.trim();
  if (userMessage === "") return;

  addChatMessage("user", userMessage);
  chatInput.value = "";
  questionCount++;
  updateChatCounter();

  // Generate a response based on the user's question
  generateClue(userMessage)
    .then(assistantMessage => {
      addChatMessage("assistant", assistantMessage);
    })
    .catch(error => {
      console.error('Error generating clue:', error);
      addChatMessage("assistant", "I'm sorry, I couldn't process your request.");
    });
});

function addChatMessage(sender, message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chat-message", sender);
  chatWindow.appendChild(messageDiv);

  if (sender === "assistant") {
    streamAssistantMessage(messageDiv, message);
  } else {
    messageDiv.textContent = message;
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom
  }
}

function updateChatCounter() {
  const questionsLeft = maxQuestions - questionCount;
  chatCounter.textContent = `Questions left: ${questionsLeft}`;
}

// Clue Generation Logic

function generateClue(question) {
  return new Promise((resolve, reject) => {
    const lowerQuestion = question.toLowerCase();

    if (godModeActive) {
      if (lowerQuestion.includes("def") || lowerQuestion.includes("definition")) {
        // Fetch and provide the definition
        fetchDefinition(targetWord)
          .then(definition => {
            resolve(`Definition of "${targetWord}": ${definition}`);
          })
          .catch(error => {
            console.error('Error fetching definition:', error);
            resolve(`Definition not found for "${targetWord}".`);
          });
      } else {
        // Provide the word directly
        resolve(`Since you're in God Mode, the word is "${targetWord}".`);
      }
      return;
    }

    let clue = "";

    if (lowerQuestion.includes("first letter")) {
      clue = `The first letter is "${targetWord[0]}".`;
    } else if (lowerQuestion.includes("last letter")) {
      clue = `The last letter is "${targetWord[targetWord.length - 1]}".`;
    } else if (lowerQuestion.includes("number of vowels")) {
      const vowels = targetWord.match(/[AEIOU]/gi) || [];
      clue = `The word has ${vowels.length} vowel(s).`;
    } else if (lowerQuestion.includes("number of consonants")) {
      const consonants = targetWord.match(/[^AEIOU]/gi) || [];
      clue = `The word has ${consonants.length} consonant(s).`;
    } else if (lowerQuestion.includes("contains the letter")) {
      const letterMatch = lowerQuestion.match(/letter\s([a-z])/);
      if (letterMatch) {
        const letter = letterMatch[1].toUpperCase();
        if (targetWord.includes(letter)) {
          clue = `Yes, the word contains the letter "${letter}".`;
        } else {
          clue = `No, the word does not contain the letter "${letter}".`;
        }
      } else {
        clue = `Please specify the letter you're asking about.`;
      }
    } else if (lowerQuestion.includes("meaning") || lowerQuestion.includes("definition")) {
      clue = `I'm sorry, I cannot provide definitions during the game.`;
    } else {
      // Provide a random clue that hasn't been given yet
      const possibleClues = [
        `The word starts with "${targetWord[0]}".`,
        `The word ends with "${targetWord[targetWord.length - 1]}".`,
        `The word has ${targetWord.length} letters.`,
        `The second letter is "${targetWord[1]}".`,
        `The word contains the letter "${targetWord[2]}".`,
        `The word's middle letter is "${targetWord[Math.floor(targetWord.length / 2)]}".`,
        `The word has ${new Set(targetWord.split('')).size} unique letters.`,
        `The word rhymes with "${getRhymingWord(targetWord)}".`,
        `The word's letters sum up to ${getLetterSum(targetWord)} in Scrabble scores.`,
        `The word is a type of "${getWordType(targetWord)}".`
      ];

      // Filter out clues already given
      const newClues = possibleClues.filter(clue => !givenClues.includes(clue));

      if (newClues.length > 0) {
        clue = newClues[Math.floor(Math.random() * newClues.length)];
      } else {
        clue = `No more clues available. Try your best!`;
      }
    }

    // Add the clue to the list of given clues
    if (!givenClues.includes(clue)) {
      givenClues.push(clue);
    } else {
      // If the clue has been given, try to generate a new one
      return resolve(generateClue("")); // Recursion with empty question to get a random clue
    }

    resolve(clue);
  });
}

// Helper function to get a rhyming word using Datamuse API
function getRhymingWord(word) {
  // Using Datamuse API to get rhymes
  const apiUrl = `https://api.datamuse.com/words?rel_rhy=${word.toLowerCase()}&max=5`;

  // Return a random rhyming word or a placeholder
  let rhymingWord = '...';

  // Synchronous request is not possible here; return a placeholder
  return rhymingWord;
}

// Helper function to get word type using Dictionary API
function getWordType(word) {
  // Using Free Dictionary API to fetch word type
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;

  // Return a placeholder as synchronous request is not possible
  return '...';
}

// Helper function to calculate Scrabble letter sum
function getLetterSum(word) {
  const letterScores = {
    A: 1, B: 3, C: 3, D: 2, E: 1,
    F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 5, L: 1, M: 3, N: 1, O: 1,
    P: 3, Q: 10, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 4, X: 8, Y: 4,
    Z: 10
  };
  return word.split('').reduce((sum, letter) => sum + letterScores[letter.toUpperCase()], 0);
}

// Stream assistant message (for bot responses)
function streamAssistantMessage(messageDiv, fullMessage) {
  let index = 0;
  const interval = setInterval(() => {
    messageDiv.textContent += fullMessage.charAt(index);
    index++;
    if (index >= fullMessage.length) {
      clearInterval(interval);
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 50);
}

// End-of-game handling
function endGame(won) {
  chatWindow.innerHTML = "";
  fetchDefinition(targetWord)
    .then(definition => {
      const message = `...The word was "${targetWord}". Definition: ${definition}`;
      addChatMessage("assistant", message);
    })
    .catch(error => {
      console.error('Error fetching definition:', error);
      const message = `...The word was "${targetWord}". Definition not found.`;
      addChatMessage("assistant", message);
    });
}

// Fetch word definition from Free Dictionary API
function fetchDefinition(word) {
  // Using Free Dictionary API to fetch word definition
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;

  return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Store API response for God Mode
      apiResponses.push({ api: 'Dictionary Definition', response: data });
      if (data[0] && data[0].meanings && data[0].meanings[0]) {
        const definition = data[0].meanings[0].definitions[0].definition;
        return definition;
      } else {
        // Use fallback API if definition not found
        return fetchFallbackDefinition(word);
      }
    })
    .catch(error => {
      // Use fallback API in case of error
      return fetchFallbackDefinition(word);
    });
}

// Fallback definition using Merriam-Webster's Collegiate Dictionary API
function fetchFallbackDefinition(word) {
  const apiKey = 'YOUR_MERRIAM_WEBSTER_API_KEY'; // Replace with your API key
  const apiUrl = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word.toLowerCase()}?key=${apiKey}`;

  return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Store API response for God Mode
      apiResponses.push({ api: 'Merriam-Webster Definition', response: data });
      if (data[0] && data[0].shortdef && data[0].shortdef[0]) {
        const definition = data[0].shortdef[0];
        return definition;
      } else {
        throw new Error('Definition not found');
      }
    })
    .catch(error => {
      console.error('Error fetching fallback definition:', error);
      throw new Error('Definition not found');
    });
}

// Adjust chat window height on window resize
window.addEventListener('resize', () => {
  adjustChatWindowHeight();

  // Hide or show chat container based on window width
  if (window.innerWidth <= 600) {
    chatContainer.classList.add('hidden');
    chatToggleButton.innerHTML = '<i class="bi bi-chat-dots"></i> Open Hint Bot';
  } else {
    chatContainer.classList.remove('hidden');
  }
});

// Word Length Selector
wordLengthSelector.addEventListener('change', () => {
  wordLength = parseInt(wordLengthSelector.value);
  fetchWords();
});

// Theme Switch
themeSwitch.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  themeSwitch.innerHTML = document.body.classList.contains('dark-mode') ?
    '<i class="bi bi-moon-stars-fill"></i>' :
    '<i class="bi bi-brightness-high-fill"></i>';
});

// Apply dark mode based on time
function applyDarkMode() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) {
    document.body.classList.add('dark-mode');
    themeSwitch.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
  } else {
    document.body.classList.remove('dark-mode');
    themeSwitch.innerHTML = '<i class="bi bi-brightness-high-fill"></i>';
  }
}

// Style Selector
styleSelector.addEventListener('change', () => {
  applyStyle(styleSelector.value);
});

function applyStyle(styleName) {
  const styleClasses = [
    'neon-night',
    'ocean-breeze',
    'solar-flare',
    'forest-glade',
    'rose-garden',
    'midnight-blue',
    'sunset-blush',
    'cyberpunk',
    'minimalist',
    'vintage'
  ];

  // Remove all style classes
  document.body.classList.remove(...styleClasses);

  // Add the selected style class
  if (styleName !== 'default') {
    document.body.classList.add(styleName);
  }

  // Ensure dark mode is re-applied if it's enabled
  if (document.body.classList.contains('dark-mode')) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

function showGodMode() {
    console.log("God Mode Function Triggered");
    godModeActive = true;
  
    // Create a modal to display the target word and definition
    const modal = document.createElement('div');
    modal.id = 'god-mode-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>God Mode Activated</h2>
        <p>The target word is: <strong>${targetWord}</strong></p>
        <p id="god-mode-definition">Fetching definition...</p>
      </div>
    `;
    document.body.appendChild(modal);
  
    // Fetch and display the definition
    fetchDefinition(targetWord)
      .then(definition => {
        const definitionDiv = modal.querySelector('#god-mode-definition');
        definitionDiv.textContent = `Definition: ${definition}`;
      })
      .catch(error => {
        console.error('Error fetching definition:', error);
        const definitionDiv = modal.querySelector('#god-mode-definition');
        definitionDiv.textContent = `Definition not found.`;
      });
  
    // Show the modal
    modal.style.display = 'block';
  
    // Close the modal when the close button is clicked
    modal.querySelector('.close-button').addEventListener('click', () => {
      console.log("Modal closed");
      modal.style.display = 'none';
      document.body.removeChild(modal);
    });
  }

// Chat Toggle Functionality
chatToggleButton.addEventListener('click', () => {
  chatContainer.classList.toggle('hidden');
  if (chatContainer.classList.contains('hidden')) {
    chatToggleButton.innerHTML = '<i class="bi bi-chat-dots"></i> Open Hint Bot';
  } else {
    chatToggleButton.innerHTML = '<i class="bi bi-chat-dots"></i> Close Hint Bot';
  }
});

// Music Setup with Debugging
const backgroundMusic = new Audio("music.mp3");
backgroundMusic.loop = true; // Enable looping
let isMusicPlaying = false;

// Music Toggle Button
const musicSwitch = document.getElementById("music-switch");
musicSwitch.addEventListener("click", async () => {
  try {
    if (isMusicPlaying) {
      backgroundMusic.pause();
      musicSwitch.innerHTML = '<i class="bi bi-play-circle"></i>';
    } else {
      await backgroundMusic.play(); // Use await to handle potential errors
      musicSwitch.innerHTML = '<i class="bi bi-pause-circle"></i>';
    }
    isMusicPlaying = !isMusicPlaying;
  } catch (error) {
    console.error("Error toggling music:", error);
    // Optional: Display an error message to the user
  }
});

// Initialize the game on page load
fetchWords();