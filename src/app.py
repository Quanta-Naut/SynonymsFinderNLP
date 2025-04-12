from flask import Flask, render_template, request, jsonify
import nltk
from nltk.corpus import wordnet
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask application
app = Flask(__name__, 
            static_folder='../static',
            template_folder='../templates')

def get_synonyms(word):
    """Get synonyms for a given word using WordNet"""
    synonyms = set()
    
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            synonyms.add(lemma.name().replace('_', ' '))
            
    # Remove the original word from synonyms
    if word in synonyms:
        synonyms.remove(word)
        
    return list(synonyms)

def get_similar_words_by_context(word):
    """Get similar words based on context using Brown corpus"""
    from nltk.collocations import BigramCollocationFinder
    from nltk.metrics import BigramAssocMeasures
    from nltk.corpus import brown
    
    # Create a bigram finder with the Brown corpus
    finder = BigramCollocationFinder.from_words(brown.words())
    
    # Find bigrams that contain our word
    similar_words = set()
    for bigram in finder.nbest(BigramAssocMeasures.likelihood_ratio, 1000):
        if word in bigram:
            # Add the other word from the bigram
            similar_word = bigram[0] if bigram[1] == word else bigram[1]
            similar_words.add(similar_word)
    
    return list(similar_words)

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    """Process the word and return similar words"""
    data = request.get_json()
    word = data.get('word', '').lower().strip()
    
    if not word:
        return jsonify({'error': 'No word provided'})
    
    try:
        # Get synonyms using WordNet
        synonyms = get_synonyms(word)
        
        # Get contextually similar words
        context_words = get_similar_words_by_context(word)
        
        return jsonify({
            'word': word,
            'synonyms': synonyms[:10],  # Limit to 10 synonyms
            'context_words': context_words[:10]  # Limit to 10 context words
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, port=port, host='0.0.0.0')