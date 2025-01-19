import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../Config";

const genAIInstance = new GoogleGenerativeAI(config.geminiKey || "");

export default genAIInstance;
