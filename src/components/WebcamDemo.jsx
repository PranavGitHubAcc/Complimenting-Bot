import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useFaceDetection from "../hooks/useFaceDetection";
import FaceDetection from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";
import sendToGemini from "../utils/sendToGemini";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

const width = 1200;
const height = 1200;

const WebcamDemo = ({ conversation }) => {
    const [snapshot, setSnapshot] = useState(null);

    const { webcamRef, boundingBox, isLoading, detected, facesDetected } =
        useFaceDetection({
            faceDetectionOptions: {
                model: "short",
            },
            faceDetection: new FaceDetection.FaceDetection({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
            }),
            camera: ({ mediaSrc, onFrame }) =>
                new Camera(mediaSrc, {
                    onFrame,
                    width,
                    height,
                }),
        });

    const fetchSpeech = (textToSpeak) => {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
            import.meta.env.VITE_REACT_APP_AZURE_API_KEY,
            import.meta.env.VITE_REACT_APP_AZURE_REGION
        );

        speechConfig.speechSynthesisVoiceName =
            "en-US-Aria:DragonHDLatestNeural";
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new SpeechSDK.SpeechSynthesizer(
            speechConfig,
            audioConfig
        );

        synthesizer.speakTextAsync(
            textToSpeak,
            (result) => {
                if (
                    result.reason ===
                    SpeechSDK.ResultReason.SynthesizingAudioCompleted
                ) {
                    console.log("Speech synthesized successfully.");
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

    useEffect(() => {
        if (detected && webcamRef?.current && conversation) {
            const screenshot = webcamRef.current.getScreenshot();
            if (screenshot) {
                setSnapshot(screenshot);
                const base64Image = snapshot?.split(",")[1];
                sendToGemini(base64Image)
                    .then((responseText) => {
                        console.log("AI Response:", responseText);
                        fetchSpeech(responseText);
                    })
                    .catch((error) => {
                        console.error("Error sending to Gemini API:", error);
                    });
            }
        }
    }, [conversation, webcamRef]);

    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: "-100px",
                transform: "translateX(-50%)",
            }}
        >
            <div
                style={{
                    width,
                    height,
                    position: "relative",
                    transform: "scaleX(-1)",
                }}
            >
                {boundingBox.map((box, index) => (
                    <div
                        key={index}
                        style={{
                            border: "4px solid red",
                            position: "absolute",
                            top: `${box.yCenter * 100}%`,
                            left: `${box.xCenter * 100}%`,
                            width: `${box.width * 100}%`,
                            height: `${box.height * 80}%`,
                            zIndex: 1,
                        }}
                    />
                ))}
                <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    forceScreenshotSourceSize
                    style={{
                        height,
                        width,
                        position: "absolute",
                    }}
                />
            </div>
        </div>
    );
};

export default WebcamDemo;
