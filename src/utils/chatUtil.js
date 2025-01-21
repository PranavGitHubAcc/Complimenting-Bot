export const eventData = {
    general: {
        name: "Tech Fest 2025",
        date: "January 24-25, 2025",
        timing: "9 AM to 6 PM daily",
        venue: "Main Campus Building",
        sponsors: "MSI, SkillsMetrix, Unnati"
    },
    events: [
        {
            name: "Techeshi's Castle",
            location: "4th Floor, Room 404",
            timing: "10 AM - 4 PM",
            description:
                "Techeshi's Castle is an exhilarating obstacle course event similar to the famous TV show Takeshi's Castle featuring challenges like Circuit Showdown, Laser Labyrinth, and Target Shooting Arena. It blends technology with excitement, offering fun for everyone!",
            leads: "Pranav Mahajan and Onkar Mendhapurkar",
            prize_pool: "₹6000",
            organizing_club: "ACM and Rotonity",
            partipation: "Team",
        },
        {
            name: "Martian Marathon",
            location: "6th Floor Mechtronics IoT lab",
            timing: "10 AM - 4 PM",
            description:
                "Conquer the craters, master the Martian terrain! Participants will race a rover from the home position to the designated safe zone, overcoming various challenges along the way. The event emphasizes problem-solving and navigation in a simulated Martian environment.",
            leads: "",
            prize_pool: "₹8000",
            organizing_club: "Antariksh - Space & Astronomy Club",
            participation: "Individual",
        },
    ],
};

export const generateChatResponse = async ({
    questionInput,
    genAIInstance,
    setIsGenerating,
    setChatQuestion,
    stopCurrentAudio,
    setAnswer,
    fetchSpeech,
}) => {
    if (!questionInput.trim()) return;

    setIsGenerating(true);
    stopCurrentAudio();

    try {
        const model = genAIInstance.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        // Provide the complete context to Gemini
        setChatQuestion(questionInput);

        const prompt = `
        You are an AI assistant for our Tech Fest. Here is all the information about our fest:
        ${JSON.stringify(eventData, null, 2)}

        Please answer this question naturally and concisely: "${questionInput}"
        Only include information that's directly relevant to the question.
        `;

        const answerResponse = await model.generateContent(prompt);
        const answerData = answerResponse.response.text();

        setIsGenerating(false);
        setAnswer((prev) => ({
            ...prev,
            text: answerData,
        }));

        fetchSpeech(answerData);
        
        return answerData;
    } catch (err) {
        console.error(err);
        setIsGenerating(false);
        throw err;
    }
};
