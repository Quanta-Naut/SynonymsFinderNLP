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
    const word = data?.word || ""; // use the correct key name
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