import os
from flask import Flask, render_template, request, jsonify
from googletrans import Translator
import time

# Ensure the static/audio directory exists
os.makedirs('static/audio', exist_ok=True)

app = Flask(__name__)
translator = Translator()

# Try to import the Google Cloud Text-to-Speech library
try:
    from google.cloud import texttospeech
    tts_client = texttospeech.TextToSpeechClient()
except ImportError:
    print("Warning: Google Cloud Text-to-Speech library not found. Using fallback TTS.")
    from gtts import gTTS
    tts_client = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data['text']
    source_lang = data['source_lang']
    target_lang = data['target_lang']
    
    try:
        translation = translator.translate(text, src=source_lang, dest=target_lang)
        
        if tts_client:
            # Google Cloud Text-to-Speech
            synthesis_input = texttospeech.SynthesisInput(text=translation.text)
            voice = texttospeech.VoiceSelectionParams(
                language_code=target_lang,
                name="en-US-Neural2-J",
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            response = tts_client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
            audio_content = response.audio_content
        else:
            # Fallback to gTTS
            tts = gTTS(text=translation.text, lang=target_lang)
            audio_file = f"static/audio/translation_{int(time.time())}.mp3"
            tts.save(audio_file)
            with open(audio_file, "rb") as audio:
                audio_content = audio.read()

        # Save the audio file
        audio_file = f"static/audio/translation_{int(time.time())}.mp3"
        with open(audio_file, "wb") as out:
            out.write(audio_content)
        
        return jsonify({
            'translation': translation.text,
            'audio_url': f"/{audio_file}"
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
