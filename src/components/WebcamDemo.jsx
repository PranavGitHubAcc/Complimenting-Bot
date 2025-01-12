import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useFaceDetection from "../hooks/useFaceDetection";
import FaceDetection from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";
import sendToGemini from "../utils/sendToGemini";

const width = 1200;
const height = 1200;

const WebcamDemo = () => {
    const [detectionStartTime, setDetectionStartTime] = useState(null);
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

    useEffect(() => {
        const interval = setInterval(() => {
            if (detected) {
                // Face is detected
                if (!detectionStartTime) {
                    setDetectionStartTime(Date.now());
                } else if (Date.now() - detectionStartTime >= 10000) {
                    if (webcamRef?.current) {
                        const screenshot = webcamRef.current.getScreenshot();
                        if (screenshot) {
                            setSnapshot(screenshot); // Save the screenshot
                            const base64Image = snapshot?.split(",")[1];
                            sendToGemini(base64Image)
                                .then((responseText) => {
                                    console.log("AI Response:", responseText);
                                })
                                .catch((error) => {
                                    console.error(
                                        "Error sending to Gemini API:",
                                        error
                                    );
                                });
                        }
                    }
                    setDetectionStartTime(null); // Reset timer
                }
            } else {
                // No face detected, reset timer
                setDetectionStartTime(null);
            }
        }, 100); // Check every 100ms

        return () => clearInterval(interval);
    }, [detected, detectionStartTime, webcamRef]);

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
