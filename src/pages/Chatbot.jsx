import React, { useState, useEffect, useRef } from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { TalkingAvatar } from "../components/TalkingAvatar";
import WebcamDemo from "../components/WebcamDemo";
import { IoSend, IoMic, IoMicOff } from "react-icons/io5";
import "./Chatbot.css";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import genAIInstance from "../utils/geminiInstance";

function Chatbot() {
    const [questionInput, setQuestionInput] = useState("");
    const [answer, setAnswer] = useState({});
    const [chatQuestion, setChatQuestion] = useState("Enter your question");
    const [isListening, setIsListening] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Initialize SpeechRecognition
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    // Handle speech recognition result
    useEffect(() => {
        if (recognition) {
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-IN";

            recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                setQuestionInput(speechResult); // Set recognized speech as input
            };

            recognition.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
            };

            recognition.onend = () => setIsListening(false);
        }
    }, [recognition]);

    const fetchSpeech = (answerText) => {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
            import.meta.env.VITE_REACT_APP_AZURE_API_KEY,
            import.meta.env.VITE_REACT_APP_AZURE_REGION
        );

        // speechConfig.speechSynthesisVoiceName = "en-IN-AashiNeural"; // Replace with desired voice
        // speechConfig.speechSynthesisVoiceName = "en-IE-EmilyNeural"; // Replace with desired voice
        speechConfig.speechSynthesisVoiceName =
            "en-US-Aria:DragonHDLatestNeural"; // Replace with desired voice

        const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new SpeechSDK.SpeechSynthesizer(
            speechConfig,
            audioConfig
        );

        const visemesData = [];

        // Handle viseme events
        synthesizer.synthesisVisemeReceived = (s, e) => {
            visemesData.push({
                visemeId: e.visemeId,
                audioOffset: e.audioOffset,
            });
        };

        synthesizer.speakTextAsync(
            answerText,
            (result) => {
                if (
                    result.reason ===
                    SpeechSDK.ResultReason.SynthesizingAudioCompleted
                ) {
                    console.log("Speech synthesized successfully");
                    setAnswer((prev) => ({
                        ...prev,
                        audioPlayer: new Audio(result.audioData),
                        visemes: visemesData,
                    }));
                    setIsSpeaking(true);
                    const audioPlayer = new Audio(
                        URL.createObjectURL(result.audioData)
                    );
                    audioPlayer.play();
                    audioPlayer.onended = () => setIsSpeaking(false);
                } else {
                    console.error(
                        "Speech synthesis failed:",
                        result.errorDetails
                    );
                }
                synthesizer.close();
            },
            (err) => {
                console.error("Error synthesizing speech:", err);
                synthesizer.close();
            }
        );
    };

    const handleSend = async () => {
        if (!questionInput.trim()) return;
        setIsGenerating(true);

        const model = genAIInstance.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        try {
            const answerResponse = await model.generateContent(chatQuestion);
            const answerData = answerResponse.response.text();
            setIsGenerating(false);
            setAnswer((prev) => {
                return {
                    ...prev,
                    text: answerData,
                };
            });
            fetchSpeech(answerData);
            setChatQuestion(questionInput);
            console.log(answer);
        } catch (err) {
            console.log(err);
        }
    };

    const handleMicClick = () => {
        setQuestionInput("");
        if (recognition) {
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
            setIsListening((prevState) => !prevState);
        } else {
            alert("Speech recognition is not supported in this browser.");
        }
    };

    return (
        <div className="chatbot-container">
            <div className="main-container">
                <WebcamDemo />
                <div className="avatar-container">
                    <Canvas
                        camera={{
                            zoom: 1,
                        }}
                    >
                        <OrbitControls
                            target={[0, 1.3, 0]}
                            enableRotate={false}
                            enablePan={false}
                            enableZoom={false}
                        />
                        <Environment preset="sunset" />
                        <ambientLight intensity={0.8} color="pink" />
                        <TalkingAvatar
                            answer={answer}
                            isSpeaking={isSpeaking}
                        />
                    </Canvas>
                </div>
                <div className="input-container">
                    <div className="input-area">
                        <button
                            onClick={handleMicClick}
                            className={`mic-button ${
                                isListening ? "listening" : ""
                            }`}
                            style={{ color: "#fff" }}
                        >
                            {isListening ? <IoMicOff /> : <IoMic />}
                        </button>
                        <div>
                            <input
                                type="text"
                                value={questionInput}
                                onChange={(e) =>
                                    setQuestionInput(e.target.value)
                                }
                                placeholder="Type a message..."
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSend()
                                }
                            />
                            <button
                                onClick={handleSend}
                                className="send-button"
                            >
                                <IoSend />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;
