import { GoogleGenerativeAI, InlineDataPart } from '@google/generative-ai';
import config from '../Config';

const sendToGemini = async (base64Image: string | undefined) => {
  if (!base64Image) {
    throw new Error('Base64 image data is required.');
  }

  console.log(config);

  const genAI = new GoogleGenerativeAI(config.geminiKey || ''); // Replace with your API key
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Prepare image in Base64 format
  const image: InlineDataPart = {
    inlineData: {
      data: base64Image,
      mimeType: 'image/jpeg',
    },
  };

  // Run prompt
  const prompt = 'Greet and give one compliment according to what you see in the image.';

  try {
    const apiResult = await model.generateContent([prompt, image]);
    console.log(apiResult);
    return apiResult.response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

export default sendToGemini;
