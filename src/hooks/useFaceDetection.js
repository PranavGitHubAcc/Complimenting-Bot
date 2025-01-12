import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

export const useFaceDetection = (props = {}) => {
    const {
        mirrored,
        handleOnResults,
        faceDetectionOptions: options,
        faceDetection: faceDetectionInitializer,
        camera: cameraInitializer,
    } = props;

    // Initialize states
    const [boundingBox, setBoundingBox] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize refs
    const webcamRef = useRef(null);
    const imgRef = useRef(null);
    const camera = useRef(cameraInitializer).current;
    const faceDetection = useRef(faceDetectionInitializer).current;
    const faceDetectionOptions = useRef(options);

    const onResults = useCallback(
        (results) => {
            // Call the callback if provided
            if (handleOnResults) handleOnResults(results);

            const { detections } = results;

            // Calculate and set bounding boxes
            const boundingBoxes = detections.map((detection) => {
                const xCenter =
                    detection.boundingBox.xCenter -
                    detection.boundingBox.width / 2;
                return {
                    ...detection.boundingBox,
                    yCenter:
                        detection.boundingBox.yCenter -
                        detection.boundingBox.height / 2,
                    xCenter: mirrored ? 1 - xCenter : xCenter,
                };
            });

            setBoundingBox(boundingBoxes);
        },
        [handleOnResults, mirrored]
    );

    const handleFaceDetection = useCallback(
        async (mediaSrc) => {
            // Configure face detection
            faceDetection.setOptions({ ...faceDetectionOptions.current });
            faceDetection.onResults(onResults);

            // Handle webcam detection
            if (mediaSrc instanceof HTMLVideoElement && camera) {
                const cameraConfig = {
                    mediaSrc,
                    width: mediaSrc.videoWidth,
                    height: mediaSrc.videoHeight,
                    onFrame: async () => {
                        await faceDetection.send({ image: mediaSrc });
                        if (isLoading) setIsLoading(false);
                    },
                };

                camera(cameraConfig).start();
            }

            // Handle image face detection
            if (mediaSrc instanceof HTMLImageElement) {
                await faceDetection.send({ image: mediaSrc });
                if (isLoading) setIsLoading(false);
            }
        },
        [camera, faceDetection, isLoading, onResults]
    );

    useEffect(() => {
        // Initialize face detection for video
        if (webcamRef.current && webcamRef.current.video) {
            handleFaceDetection(webcamRef.current.video);
        }

        // Initialize face detection for image
        if (imgRef.current) {
            handleFaceDetection(imgRef.current);
        }

        // Cleanup function
        const videoElement = webcamRef?.current?.video;

        return () => {
            if (!videoElement) return;

            // Stop all tracks
            if (videoElement && videoElement.srcObject) {
                const stream = videoElement.srcObject;
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                }
            }

            // Stop camera if it exists
            if (!camera) return;

            camera({
                mediaSrc: videoElement,
                onFrame: () => Promise.resolve(),
                width: videoElement.videoWidth,
                height: videoElement.videoHeight,
            }).stop();
        };
    }, [handleFaceDetection, isLoading, onResults, camera]);

    return {
        boundingBox,
        isLoading,
        detected: boundingBox.length > 0,
        facesDetected: boundingBox.length,
        webcamRef,
        imgRef,
    };
};

export default useFaceDetection;
