// DOM Elements
const wordInput = document.getElementById('wordInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const searchedWord = document.getElementById('searchedWord');
const synonymsList = document.getElementById('synonymsList');
const definitionsList = document.getElementById('definitionsList');
const synonymsLoading = document.getElementById('synonymsLoading');
const definitionsLoading = document.getElementById('definitionsLoading');
const synonymsEmpty = document.getElementById('synonymsEmpty');
const definitionsEmpty = document.getElementById('definitionsEmpty');
const suggestions = document.getElementById('suggestions');
const popupOverlay = document.getElementById('popup-overlay');

// Popup functionality
const methodBoxes = document.querySelectorAll('.method');
const closePopupBtns = document.querySelectorAll('.close-popup');

// Function to open popup
function openPopup(popupId) {
    // Hide all popups first
    document.querySelectorAll('.popup').forEach(popup => {
        popup.style.display = 'none';
        popup.classList.remove('active');
    });
    
    // Show the selected popup
    const popup = document.getElementById(popupId);
    popup.style.display = 'block';
    
    // Show overlay
    popupOverlay.classList.add('active');
    
    // Add a slight delay before adding the active class for animation
    setTimeout(() => {
        popup.classList.add('active');
    }, 10);
}

// Function to close all popups
function closePopups() {
    document.querySelectorAll('.popup').forEach(popup => {
        popup.classList.remove('active');
    });
    
    popupOverlay.classList.remove('active');
    
    // Hide popups after animation completes
    setTimeout(() => {
        document.querySelectorAll('.popup').forEach(popup => {
            popup.style.display = 'none';
        });
    }, 300);
}

// Set up event listeners for method boxes
methodBoxes.forEach(box => {
    box.addEventListener('click', function() {
        const popupId = this.getAttribute('data-popup');
        if (popupId) {
            openPopup(popupId);
        }
    });
});

// Set up event listeners for close buttons
closePopupBtns.forEach(btn => {
    btn.addEventListener('click', closePopups);
});

// Close popups when clicking on overlay
popupOverlay.addEventListener('click', closePopups);

// Close popups on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePopups();
    }
});

// Common English words for suggestions
const commonWords = [
    'love', 'happy', 'sad', 'good', 'bad', 'large', 'small', 
    'beautiful', 'ugly', 'fast', 'slow', 'smart', 'intelligent',
    'funny', 'serious', 'important', 'necessary', 'difficult',
    'easy', 'simple', 'complex', 'interesting', 'boring'
];

// Function to search for synonyms and definitions
async function searchSimilarWords(word) {
    if (!word.trim()) return;
    
    showLoading();
    hideResults();
    
    try {
        const response = await fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ word: word.trim() })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        displayResults(data);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showError(error.message);
    }
}

// Function to display results
function displayResults(data) {
    resultsContainer.style.display = 'block';
    
    // Handle multi-word input results
    if (data.words && data.words.length > 0) {
        // Multi-word input
        searchedWord.textContent = data.input;
        hideLoading();
        
        // Clear previous results
        synonymsList.innerHTML = '';
        definitionsList.innerHTML = '';
        synonymsEmpty.style.display = 'none';
        definitionsEmpty.style.display = 'none';
        
        // Process each word's results - separate for synonyms and definitions
        data.words.forEach((wordData, index) => {
            // Create the synonyms section
            const synWordSection = document.createElement('div');
            synWordSection.className = 'word-section';
            
            // Create word header for synonyms
            const synWordHeader = document.createElement('h3');
            synWordHeader.className = 'word-header';
            synWordHeader.textContent = wordData.word;
            synWordSection.appendChild(synWordHeader);
            
            // Create synonyms section for this word
            const wordSynonyms = document.createElement('div');
            wordSynonyms.className = 'word-synonyms';
            const synonymsTitle = document.createElement('h4');
            synonymsTitle.textContent = 'Synonyms:';
            wordSynonyms.appendChild(synonymsTitle);
            
            if (wordData.synonyms && wordData.synonyms.length > 0) {
                const synList = document.createElement('ul');
                synList.className = 'synonyms-list';
                
                wordData.synonyms.forEach(synonym => {
                    const li = document.createElement('li');
                    const wordRectangle = document.createElement('div');
                    wordRectangle.className = 'word-rectangle';
                    
                    wordRectangle.innerHTML = `
                        <span class="word">${synonym}</span>
                        <i class="fas fa-search search-icon"></i>
                    `;
                    
                    li.appendChild(wordRectangle);
                    
                    // Add event listener to search for the word
                    li.addEventListener('click', () => {
                        wordInput.value = synonym;
                        searchSimilarWords(synonym);
                    });
                    
                    synList.appendChild(li);
                });
                
                wordSynonyms.appendChild(synList);
            } else {
                const emptySyn = document.createElement('div');
                emptySyn.className = 'empty-message';
                emptySyn.innerHTML = '<i class="fas fa-info-circle"></i><p>No synonyms found</p>';
                wordSynonyms.appendChild(emptySyn);
            }
            
            synWordSection.appendChild(wordSynonyms);
            
            // Add a divider if not the last word
            if (index < data.words.length - 1) {
                const divider = document.createElement('hr');
                divider.className = 'word-divider';
                synWordSection.appendChild(divider);
            }
            
            // Add this word's synonyms to synonymsList
            synonymsList.appendChild(synWordSection);
            
            // Create the definitions section - separate DOM elements
            const defWordSection = document.createElement('div');
            defWordSection.className = 'word-section';
            
            // Create word header for definitions
            const defWordHeader = document.createElement('h3');
            defWordHeader.className = 'word-header';
            defWordHeader.textContent = wordData.word;
            defWordSection.appendChild(defWordHeader);
            
            // Create definitions section for this word
            const wordDefinitions = document.createElement('div');
            wordDefinitions.className = 'word-definitions';
            
            if (wordData.definitions && wordData.definitions.length > 0) {
                wordData.definitions.forEach(definition => {
                    const definitionItem = document.createElement('div');
                    definitionItem.className = 'definition-item';
                    
                    // Create HTML structure for the definition
                    let definitionHtml = '';
                    if (definition.pos) {
                        definitionHtml += `<div class="definition-pos">${definition.pos}</div>`;
                    }
                    
                    definitionHtml += `<div class="definition-text">${definition.text}</div>`;
                    
                    // Add examples if available
                    if (definition.examples && definition.examples.length > 0) {
                        definitionHtml += '<div class="definition-examples">';
                        definition.examples.forEach(example => {
                            definitionHtml += `<div class="definition-example">${example}</div>`;
                        });
                        definitionHtml += '</div>';
                    }
                    
                    definitionItem.innerHTML = definitionHtml;
                    wordDefinitions.appendChild(definitionItem);
                });
            } else {
                const emptyDef = document.createElement('div');
                emptyDef.className = 'empty-message';
                emptyDef.innerHTML = '<i class="fas fa-info-circle"></i><p>No definitions found</p>';
                wordDefinitions.appendChild(emptyDef);
            }
            
            defWordSection.appendChild(wordDefinitions);
            
            // Add a divider if not the last word
            if (index < data.words.length - 1) {
                const divider = document.createElement('hr');
                divider.className = 'word-divider';
                defWordSection.appendChild(divider);
            }
            
            // Add this word's definitions to definitionsList
            definitionsList.appendChild(defWordSection);
        });
        
        return;
    }
    
    // Handle single word results (original functionality)
    const word = data?.word || "";
    searchedWord.textContent = `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    
    hideLoading();
    
    // Display definitions
    if (data.definitions && data.definitions.length > 0) {
        definitionsList.innerHTML = '';
        definitionsEmpty.style.display = 'none';
        
        data.definitions.forEach(definition => {
            const definitionItem = document.createElement('div');
            definitionItem.className = 'definition-item';
            
            // Create HTML structure for the definition
            let definitionHtml = '';
            if (definition.pos) {
                definitionHtml += `<div class="definition-pos">${definition.pos}</div>`;
            }
            
            definitionHtml += `<div class="definition-text">${definition.text}</div>`;
            
            // Add examples if available
            if (definition.examples && definition.examples.length > 0) {
                definitionHtml += '<div class="definition-examples">';
                definition.examples.forEach(example => {
                    definitionHtml += `<div class="definition-example">${example}</div>`;
                });
                definitionHtml += '</div>';
            }
            
            definitionItem.innerHTML = definitionHtml;
            definitionsList.appendChild(definitionItem);
        });
    } else {
        definitionsList.innerHTML = '';
        definitionsEmpty.style.display = 'flex';
    }
    
    // Display synonyms
    if (data.synonyms && data.synonyms.length > 0) {
        synonymsList.innerHTML = '';
        synonymsEmpty.style.display = 'none';
        
        data.synonyms.forEach(word => {
            const li = document.createElement('li');
            const wordRectangle = document.createElement('div');
            wordRectangle.className = 'word-rectangle';
            
            wordRectangle.innerHTML = `
                <span class="word">${word}</span>
                <i class="fas fa-search search-icon"></i>
            `;
            
            li.appendChild(wordRectangle);
            
            // Add event listener to search for the word
            li.addEventListener('click', () => {
                wordInput.value = word;
                searchSimilarWords(word);
            });
            
            synonymsList.appendChild(li);
        });
    } else {
        synonymsList.innerHTML = '';
        synonymsEmpty.style.display = 'flex';
    }
}

// Show loading spinners
function showLoading() {
    synonymsLoading.style.display = 'flex';
    definitionsLoading.style.display = 'flex';
    synonymsEmpty.style.display = 'none';
    definitionsEmpty.style.display = 'none';
}

// Hide loading spinners
function hideLoading() {
    synonymsLoading.style.display = 'none';
    definitionsLoading.style.display = 'none';
}

// Hide results container
function hideResults() {
    synonymsList.innerHTML = '';
    definitionsList.innerHTML = '';
}

// Show error message
function showError(message) {
    resultsContainer.style.display = 'block';
    searchedWord.textContent = 'Error';
    
    synonymsEmpty.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>${message}</p>`;
    definitionsEmpty.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>${message}</p>`;
    
    synonymsEmpty.style.display = 'flex';
    definitionsEmpty.style.display = 'flex';
}

// Show word suggestions
function showSuggestions(inputValue) {
    if (!inputValue.trim()) {
        suggestions.style.display = 'none';
        return;
    }
    
    const matchedWords = commonWords.filter(word => 
        word.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    if (matchedWords.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    suggestions.innerHTML = '';
    
    matchedWords.forEach(word => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = word;
        
        div.addEventListener('click', () => {
            wordInput.value = word;
            suggestions.style.display = 'none';
            searchSimilarWords(word);
        });
        
        suggestions.appendChild(div);
    });
    
    suggestions.style.display = 'block';
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    suggestions.style.display = 'none';
    searchSimilarWords(wordInput.value);
});

wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        suggestions.style.display = 'none';
        searchSimilarWords(wordInput.value);
    }
});

wordInput.addEventListener('input', () => {
    showSuggestions(wordInput.value);
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (e.target !== wordInput && e.target !== suggestions) {
        suggestions.style.display = 'none';
    }
});