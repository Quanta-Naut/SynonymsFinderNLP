// DOM Elements
const wordInput = document.getElementById('wordInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const searchedWord = document.getElementById('searchedWord');
const synonymsList = document.getElementById('synonymsList');
const contextList = document.getElementById('contextList');
const synonymsLoading = document.getElementById('synonymsLoading');
const contextLoading = document.getElementById('contextLoading');
const synonymsEmpty = document.getElementById('synonymsEmpty');
const contextEmpty = document.getElementById('contextEmpty');
const suggestions = document.getElementById('suggestions');

// Common English words for suggestions
const commonWords = [
    'love', 'happy', 'sad', 'good', 'bad', 'large', 'small', 
    'beautiful', 'ugly', 'fast', 'slow', 'smart', 'intelligent',
    'funny', 'serious', 'important', 'necessary', 'difficult',
    'easy', 'simple', 'complex', 'interesting', 'boring'
];

// Function to search for similar words
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
    searchedWord.textContent = `"${data.word}"`;
    
    hideLoading();
    
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
    
    // Display context words
    if (data.context_words && data.context_words.length > 0) {
        contextList.innerHTML = '';
        contextEmpty.style.display = 'none';
        
        data.context_words.forEach(word => {
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
            
            contextList.appendChild(li);
        });
    } else {
        contextList.innerHTML = '';
        contextEmpty.style.display = 'flex';
    }
}

// Show loading spinners
function showLoading() {
    synonymsLoading.style.display = 'flex';
    contextLoading.style.display = 'flex';
    synonymsEmpty.style.display = 'none';
    contextEmpty.style.display = 'none';
}

// Hide loading spinners
function hideLoading() {
    synonymsLoading.style.display = 'none';
    contextLoading.style.display = 'none';
}

// Hide results container
function hideResults() {
    synonymsList.innerHTML = '';
    contextList.innerHTML = '';
}

// Show error message
function showError(message) {
    resultsContainer.style.display = 'block';
    searchedWord.textContent = 'Error';
    
    synonymsEmpty.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>${message}</p>`;
    contextEmpty.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>${message}</p>`;
    
    synonymsEmpty.style.display = 'flex';
    contextEmpty.style.display = 'flex';
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