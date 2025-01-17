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

    // useEffect(() => {
    //     if (audioPlayer) {
    //         console.log("Audio player created:", audioPlayer);
    //         console.log("Duration:", audioPlayer.duration);
    //         console.log("Ready state:", audioPlayer.readyState);

    //         // Try to play and log result
    //         const playAudio = async () => {
    //             try {
    //                 await audioPlayer.play();
    //                 console.log("Audio started playing");
    //             } catch (error) {
    //                 console.error("Error playing audio:", error);
    //             }
    //         };

    //         playAudio();

    //         // Monitor all possible audio events
    //         const events = [
    //             "loadstart",
    //             "durationchange",
    //             "loadedmetadata",
    //             "loadeddata",
    //             "progress",
    //             "canplay",
    //             "canplaythrough",
    //             "play",
    //             "playing",
    //             "timeupdate",
    //             "pause",
    //             "ended",
    //             "error",
    //         ];

    //         events.forEach((event) => {
    //             audioPlayer.addEventListener(event, () => {
    //                 console.log(`Audio event: ${event}`, {
    //                     currentTime: audioPlayer.currentTime,
    //                     duration: audioPlayer.duration,
    //                     paused: audioPlayer.paused,
    //                     ended: audioPlayer.ended,
    //                     readyState: audioPlayer.readyState,
    //                 });
    //             });
    //         });
    //     }
    // }, [audioPlayer]);

    // useEffect(() => {
    //     if (audioPlayer) {
    //         audioPlayer.addEventListener("timeupdate", () => {
    //             console.log(`Audio event: ${event}`, {
    //                 currentTime: audioPlayer?.currentTime,
    //             });
    //         });
    //     }
    // }, [audioPlayer]);

    const fetchSpeech = (answerText) => {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
            import.meta.env.VITE_REACT_APP_AZURE_API_KEY,
            import.meta.env.VITE_REACT_APP_AZURE_REGION
        );

        // speechConfig.speechSynthesisVoiceName =
        //     "en-US-Aria:DragonHDLatestNeural";

        const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
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
                    }); // or 'audio/wav' depending on your audio format
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    setIsSpeaking(true);
                    setAudioPlayer(audio);
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

        const visemesData = [];

        synthesizer.visemeReceived = function (s, e) {
            visemesData.push([e.audioOffset / 10000, e.visemeId]);

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
        setConversation((prevState) => !prevState);
    };

    const handleSend = async () => {
        if (!questionInput.trim()) return;
        setIsGenerating(true);

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
                <button
                    onClick={toggleConversation}
                    className="toggle-conversation-button"
                    style={{ position: "absolute", zIndex: 100 }}
                >
                    {conversation ? "End Conversation" : "Start Conversation"}
                </button>

                {conversation && (
                    <>
                        <WebcamDemo conversation={conversation} />
                        <div className="avatar-container">
                            <Canvas camera={{ position: [-0.04, 2.6, 3.76] }}>
                                <OrbitControls
                                    enableRotate={false}
                                    enablePan={false}
                                    enableZoom={false}
                                    target={[-0.17, 4.15, -0.46]}
                                    // Camera Position: -0.04145867475683593 2.6003529092396627 3.7695279159492094
                                    // Target Position: -0.17061215335331323 4.157998458801194 -0.46364063383683396
                                />
                                <Environment preset="sunset" />
                                <ambientLight intensity={0.8} color="pink" />
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
                    </>
                )}
            </div>
        </div>
    );
}

export default Chatbot;
