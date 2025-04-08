import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

const images = [
  "https://testvidz.blob.core.windows.net/rrv/RRV_Painting_Shakuntala.jpg?random=1",
  "https://testvidz.blob.core.windows.net/rrv/RRV_Painting_Woman_holding_a_fruit.jpg?random=2",
];

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);

  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  const prevImage = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  // useEffect(() => {
  //   let interval;
  //   if (isPlaying) {
  //     interval = setInterval(() => {
  //       nextImage();
  //     }, 2000);
  //   }
  //   return () => clearInterval(interval);
  // }, [isPlaying]);

  useEffect(() => {
    const lowerTranscript = transcript.toLowerCase();

    if (lowerTranscript.includes("start")) {
      setIsPlaying(true);
      resetTranscript();
      return;
    }

    if (lowerTranscript.includes("stop")) {
      setIsPlaying(false);
      resetTranscript();
      return;
    }

    setPrompt(transcript);
  }, [transcript, resetTranscript]);


  const extractVideoUrl = (responseText) => {
    const urlMatch = responseText.match(/https?:\/\/\S+\.mp4/);
    return urlMatch ? urlMatch[0] : null;
  };  

  const generateAnswer = async (prompt) => { 
    try {
      const imageNames = ["Shakuntala on a Swing", "Woman holding a fruit", "Mountain", "River", "Tree"];
      const currentName = imageNames[currentIndex] || "Unknown";
      console.log("Image:",currentName)
      const response = await axios.post('http://20.15.109.162:5000/telephony-response', {
        question: prompt,
        session_id: "Mayank2",
        image_name: currentName
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const answer = response.data.response;
      const videoUrl = extractVideoUrl(answer);
      setVideoUrl(videoUrl);  
      console.log("Answer is:",answer)
      return answer;
    } catch (error) {
      console.error("Error generating answer:", error);
      return "Sorry, I couldn't generate an answer.";
    }
  };
  

  const textToSpeech = async (text) => {
    try {
      const response = await axios.post('/api/text-to-speech', { text });
      const audio = new Audio(response.data.audioUrl);
      audio.play();
    } catch (error) {
      console.error("Error in TTS:", error);
    }
  };

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return <div>Your browser doesn't support speech recognition.</div>;
  }

  return (
    <div className="carousel-wrapper">
      <div className="carousel-row">
        <button className="nav-button" onClick={prevImage}>❮</button>

        <div className="carousel-container">
          <img src={images[currentIndex]} alt="carousel" className="carousel-image" />
        </div>

        <button className="nav-button" onClick={nextImage}>❯</button>
      </div>

      <div className="button-group">
        <button
          className="control-btn"
          onClick={() => {
            setIsPlaying(true);
            SpeechRecognition.startListening({ continuous: true });
          }}
        >
          Start
        </button>

        <button
          className="control-btn"
          onClick={async () => {
            setIsPlaying(false);
            SpeechRecognition.stopListening();

            const generatedAnswer = await generateAnswer(prompt);
            setAnswer(generatedAnswer); 

            //await textToSpeech(generatedAnswer);
          }}
        >
          Stop
        </button>
        <button className="control-btn" onClick={() => {
            setPrompt("");
            resetTranscript();
            setVideoUrl(null);
            setAnswer(null);
        }}>
    Reset
  </button>
      </div>

      <div className="voice-info">
        <p><strong>Listening:</strong> {listening ? 'Yes' : 'No'}</p>
      </div>

      <textarea
        className="prompt-box"
        placeholder="Enter your prompt here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      {answer && (
        <div className="answer-box">
          <h3>Generated Answer:</h3>
          <p>{answer}</p>
        </div>
      )}

      {videoUrl && (
        <div className="video-player-container">
          <video width="600" controls>
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

    </div>
  );
}

export default App;