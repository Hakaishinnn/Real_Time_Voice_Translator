let recognition;
let isListening = false;

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const output = document.getElementById('output');
    const sourceLanguage = document.getElementById('sourceLanguage');
    const targetLanguage = document.getElementById('targetLanguage');

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                    translateText(finalTranscript);
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            output.innerHTML = `
                <p>Original: ${finalTranscript || interimTranscript}</p>
                <p>Translation: <span id="translation"></span></p>
            `;
        };

        startButton.addEventListener('click', () => {
            if (!isListening) {
                recognition.lang = sourceLanguage.value;
                recognition.start();
                isListening = true;
                startButton.disabled = true;
                stopButton.disabled = false;
            }
        });

        stopButton.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                isListening = false;
                startButton.disabled = false;
                stopButton.disabled = true;
            }
        });
    } else {
        startButton.style.display = 'none';
        stopButton.style.display = 'none';
        output.textContent = 'Web Speech API is not supported in this browser.';
    }

    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', () => {
        const audio = document.querySelector('audio');
        if (audio) {
            audio.volume = volumeSlider.value;
        }
    });
});

function translateText(text) {
    fetch('/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            source_lang: document.getElementById('sourceLanguage').value,
            target_lang: document.getElementById('targetLanguage').value
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.translation) {
            document.getElementById('translation').textContent = data.translation;
            
            // Play the translated audio immediately
            setTimeout(() => {
                const audio = new Audio(data.audio_url);
                audio.play();
            }, 0);
        } else if (data.error) {
            console.error('Translation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });
}
