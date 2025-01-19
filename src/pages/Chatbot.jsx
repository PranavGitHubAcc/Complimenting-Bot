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
    const [audioPlayer, setAudioPlayer] = useState();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [conversation, setConversation] = useState(false);

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

    const stopCurrentAudio = () => {
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            setIsSpeaking(false);
        }
    };

    const fetchSpeech = async (answerText) => {
        // Stop any currently playing audio
        stopCurrentAudio();

        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
            import.meta.env.VITE_REACT_APP_AZURE_API_KEY,
            import.meta.env.VITE_REACT_APP_AZURE_REGION
        );
        // const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
        const audioConfig = null;
        console.log(audioConfig);

        const synthesizer = new SpeechSDK.SpeechSynthesizer(
            speechConfig,
            audioConfig
        );

        synthesizer.speakTextAsync(
            answerText,
            (result) => {
                if (
                    result.reason ===
                    SpeechSDK.ResultReason.SynthesizingAudioCompleted
                ) {
                    const blob = new Blob([result.audioData], {
                        type: "audio/wav",
                    });
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);

                    // Set up the new audio player
                    audio.onended = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(url); // Clean up the blob URL
                    };

                    setAnswer((prev) => ({
                        ...prev,
                        visemes: visemesData,
                    }));

                    setAudioPlayer(audio);
                    setIsSpeaking(true);
                    audio.play();
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

        const visemesData = [];

        synthesizer.visemeReceived = function (s, e) {
            visemesData.push([e.audioOffset / 5000, e.visemeId]);

            setAnswer((prev) => ({
                ...prev,
                visemes: visemesData,
            }));
            // console.log(answer);
        };

        // console.log("answer");
        // console.log(answer);
    };

    const toggleConversation = () => {
        stopCurrentAudio(); // Stop audio when toggling conversation
        setConversation((prevState) => !prevState);
    };

    const handleSend = async () => {
        if (!questionInput.trim()) return;
        setIsGenerating(true);

        // Stop any currently playing audio before generating new response
        stopCurrentAudio();

        const model = genAIInstance.getGenerativeModel({
            model: "gemini-1.5-flash",
        });
        setChatQuestion(questionInput);

        try {
            const answerResponse = await model.generateContent(questionInput);
            const answerData = answerResponse.response.text();
            setIsGenerating(false);
            setAnswer((prev) => {
                return {
                    ...prev,
                    text: answerData,
                };
            });
            fetchSpeech(answerData);
            setQuestionInput(""); // Clear input after sending
        } catch (err) {
            console.error(err);
            setIsGenerating(false);
        }
    };

    const handleMicClick = () => {
        stopCurrentAudio(); // Stop audio when starting new voice input
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

    // Cleanup effect
    useEffect(() => {
        return () => {
            stopCurrentAudio();
        };
    }, []);

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#121212", zIndex: 1 }}>
            <button
                onClick={toggleConversation}
                className="toggle-conversation-button"
                style={{ position: "absolute", zIndex: 100 }}
            >
                {conversation ? "End Conversation" : "Start Conversation"}
            </button>
            <div className="main-container">
                {conversation && (
                    <div className="page-container">
                        <div className="chatbot-container">
                            <WebcamDemo conversation={conversation} />
                            <div className="avatar-container">
                                <Canvas
                                    camera={{ position: [-0.04, 2.6, 3.76] }}
                                >
                                    <OrbitControls
                                        enableRotate={false}
                                        enablePan={false}
                                        enableZoom={false}
                                        target={[-0.17, 4.15, -0.46]}
                                    />
                                    <Environment preset="sunset" />
                                    <ambientLight
                                        intensity={0.8}
                                        color="pink"
                                    />
                                    <TalkingAvatar
                                        answer={answer}
                                        audioPlayer={audioPlayer}
                                        isSpeaking={isSpeaking}
                                        scale={[2.5, 2.5, 2.5]}
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
                                                e.key === "Enter" &&
                                                handleSend()
                                            }
                                        />
                                        <button
                                            onClick={handleSend}
                                            className="send-button"
                                            disabled={isGenerating}
                                        >
                                            <IoSend />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {conversation && (
                <div className="sidebar">
                    <h2>Suggested Questions</h2>
                    <ul>
                        {[
                            "What is the weather today?",
                            "Tell me about the latest news.",
                            "How can I improve my health?",
                            "What are some good recipes?",
                            "Recommend a book to read.",
                        ].map((question, index) => (
                            <li
                                key={index}
                                onClick={() => setQuestionInput(question)}
                                className="sidebar-question"
                            >
                                {question}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Chatbot;
    