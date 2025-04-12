from flask import Flask, render_template, request, jsonify
import nltk
from nltk.corpus import wordnet, stopwords
import os
from dotenv import load_dotenv
import logging
import functools
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check and download necessary NLTK data
def download_nltk_data():
    """Check and download required NLTK data if not already present"""
    required_corpora = ['wordnet', 'stopwords']
    
    for corpus in required_corpora:
        try:
            nltk.data.find(f'corpora/{corpus}')
            logger.info(f"Corpus '{corpus}' is already downloaded.")
        except LookupError:
            logger.info(f"Downloading corpus '{corpus}'...")
            nltk.download(corpus)
            logger.info(f"Corpus '{corpus}' has been downloaded.")

# Run the download check
download_nltk_data()

# Initialize Flask application
app = Flask(__name__, 
            static_folder='../static',
            template_folder='../templates')

# Create global cache for search results
synonym_cache = {}
definition_cache = {}

# Preload stopwords
try:
    STOP_WORDS = set(stopwords.words('english'))
    logger.info(f"Preloaded {len(STOP_WORDS)} stopwords")
except Exception as e:
    logger.error(f"Error preloading stopwords: {str(e)}")
    STOP_WORDS = set()

# Cache decorator for expensive functions
def cache_result(cache_dict, max_size=1000):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(word, *args, **kwargs):
            word_lower = word.lower()
            if word_lower in cache_dict:
                logger.info(f"Cache hit for '{word_lower}'")
                return cache_dict[word_lower]
            
            result = func(word, *args, **kwargs)
            
            # Manage cache size - remove oldest entry if full
            if len(cache_dict) >= max_size:
                oldest_key = next(iter(cache_dict))
                cache_dict.pop(oldest_key)
                
            cache_dict[word_lower] = result
            return result
        return wrapper
    return decorator

@cache_result(synonym_cache)
def get_synonyms(word):
    """Get synonyms for a given word using WordNet (cached)"""
    start_time = time.time()
    synonyms = set()
    
    # Get synonyms from all synsets
    for syn in wordnet.synsets(word)[:5]:  # Limit to first 5 synsets for speed
        # Add lemma names (synonyms)
        for lemma in syn.lemmas():
            synonyms.add(lemma.name().replace('_', ' '))
        
        # Add hypernyms (more general terms)
        for hypernym in syn.hypernyms()[:3]:
            for lemma in hypernym.lemmas():
                synonyms.add(lemma.name().replace('_', ' '))
    
    # Remove the original word from synonyms
    if word in synonyms:
        synonyms.remove(word)
    
    # If no synonyms found, try to stem the word and look for synonyms of the stem
    if len(synonyms) < 3:
        # Try simple stemming (remove common suffixes)
        for suffix in ['ing', 'ed', 's', 'es', 'ly']:
            if word.endswith(suffix) and len(word) > len(suffix) + 2:
                stem = word[:-len(suffix)]
                # Look for synonyms of the stemmed word
                for syn in wordnet.synsets(stem)[:3]:
                    for lemma in syn.lemmas():
                        synonyms.add(lemma.name().replace('_', ' '))
    
    logger.info(f"Found {len(synonyms)} synonyms for '{word}' in {time.time() - start_time:.4f} seconds")
    return list(synonyms)

@cache_result(definition_cache)
def get_definitions(word):
    """Get definitions for a given word using WordNet"""
    start_time = time.time()
    definitions = []
    
    # Get definitions from synsets
    for i, syn in enumerate(wordnet.synsets(word)):
        if i >= 3:  # Limit to first 3 definitions for clarity
            break
            
        # Format the definition with part of speech
        pos = {
            'n': 'noun',
            'v': 'verb',
            'a': 'adjective',
            's': 'adjective',
            'r': 'adverb'
        }.get(syn.pos(), '')
        
        # Add the definition with part of speech and examples
        definition_obj = {
            'pos': pos,
            'text': syn.definition(),
            'examples': syn.examples()[:2]  # Limit to first 2 examples
        }
        
        definitions.append(definition_obj)
    
    logger.info(f"Found {len(definitions)} definitions for '{word}' in {time.time() - start_time:.4f} seconds")
    return definitions

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    """Process the word(s) and return similar words"""
    start_time = time.time()
    data = request.get_json()
    input_text = data.get('word', '').lower().strip()
    
    if not input_text:
        return jsonify({'error': 'No word provided'})
    
    try:
        # Split the input into words (support multi-word inputs)
        words = input_text.split()
        result = {}
        
        # If there's only one word, process it normally
        if len(words) == 1:
            word = words[0]
            # Get synonyms using WordNet (cached)
            synonyms = get_synonyms(word)
            
            # Get definitions using WordNet (cached)
            definitions = get_definitions(word)
            
            result = {
                'word': word,
                'synonyms': synonyms[:15],  # Limit to 15 synonyms
                'definitions': definitions
            }
        else:
            # Process multiple words
            result['input'] = input_text
            result['words'] = []
            
            for word in words:
                if word in STOP_WORDS or len(word) <= 1:
                    continue  # Skip stop words and single characters
                    
                # Process each individual word
                word_result = {
                    'word': word,
                    'synonyms': get_synonyms(word)[:10],  # Limit to 10 synonyms per word
                    'definitions': get_definitions(word)
                }
                result['words'].append(word_result)
            
        logger.info(f"Total processing time for '{input_text}': {time.time() - start_time:.4f} seconds")
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error processing word '{input_text}': {str(e)}")
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, port=port, host='0.0.0.0')