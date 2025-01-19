// src/utils/sendToGemini.ts
import genAIInstance from "./geminiInstance";
import { InlineDataPart } from "@google/generative-ai";

const sendToGemini = async (base64Image: string | undefined) => {
    if (!base64Image) {
        throw new Error("Base64 image data is required.");
    }

    const model = genAIInstance.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

    const image: InlineDataPart = {
        inlineData: {
            data: base64Image,
            mimeType: "image/jpeg",
        },
    };

    const prompt =
        "Greet and give one compliment according to what you see in the image.";

    try {
        const apiResult = await model.generateContent([prompt, image]);
        console.log(apiResult);
        return apiResult.response.text();
    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
};

export default sendToGemini;
