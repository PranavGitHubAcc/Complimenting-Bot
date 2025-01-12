/* Environment Variables */

const Config = {
    nodeEnv: import.meta.env.NODE_ENV || "development",
    baseUrl: import.meta.env.VITE_REACT_APP_BASE_URL,
    geminiKey: import.meta.env.VITE_REACT_APP_GEMINI_API_KEY,
};

export default Config;
