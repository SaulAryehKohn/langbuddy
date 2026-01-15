
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Message, UserProfile, Personality, VocabItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getPersonalityGuidelines = (p: Personality): string => {
  switch (p) {
    case 'Encouraging': 
      return "Be extremely patient, use lots of positive reinforcement, and keep corrections very gentle.";
    case 'Direct': 
      return "Be straightforward, efficient, and provide clear, practical feedback without excessive fluff.";
    case 'Playful': 
      return "Use humor, be light-hearted, and occasionally suggest fun topics or cultural jokes.";
    case 'Academic': 
      return "Be formal, precise, and focus heavily on grammatical accuracy and sophisticated vocabulary.";
    default: 
      return "Be a supportive and balanced language tutor.";
  }
};

export const getBridgeTranslation = async (englishInput: string, targetLanguage: Language, difficulty: string = 'Beginner') => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Translate this English thought: "${englishInput}" into natural, conversational ${targetLanguage.name}. 
  Level: ${difficulty}.
  Return JSON: { "translation": "the text", "explanation": "Short 1-sentence tip on usage" }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["translation", "explanation"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Bridge Error", error);
    return { translation: "Error fetching translation", explanation: "" };
  }
};

export const generateInitialGreeting = async (language: Language, userProfile?: UserProfile) => {
  const model = 'gemini-3-flash-preview';
  const name = userProfile?.displayName || 'there';
  const prompt = `You are a friendly language tutor named ${userProfile?.assistantName || 'Jerome'}. 
  Personality: ${userProfile?.assistantPersonality || 'Encouraging'}.
  Generate a single, very short opening sentence in ${language.name} to greet ${name} and start a conversation. 
  Keep it simple (level: ${userProfile?.defaultDifficulty || 'Beginner'}). 
  Return ONLY the ${language.name} text, no translation.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Empty greeting received");
    return text;
  } catch (error) {
    console.error("Greeting Generation Error:", error);
    const fallbacks: Record<string, string> = {
      fr: `Bonjour ${name} ! Comment ça va ?`,
      de: `Hallo ${name}! Wie geht es dir?`,
      es: `¡Hola ${name}! ¿Cómo estás?`,
      it: `Ciao ${name}! Come va?`,
    };
    return fallbacks[language.code] || `Hello ${name}! Let's practice ${language.name}.`;
  }
};

export const getGeminiChatResponse = async (
  language: Language,
  history: Message[],
  userInput: string,
  userProfile?: UserProfile
) => {
  const model = 'gemini-3-flash-preview';
  const name = userProfile?.displayName || 'User';
  const assistantName = userProfile?.assistantName || 'Jerome';
  const personality = userProfile?.assistantPersonality || 'Encouraging';
  const difficulty = userProfile?.defaultDifficulty || 'Beginner';
  
  const systemInstruction = `
    You are ${assistantName}, an expert language tutor for ${language.name}. 
    The student is ${name}. 
    Target Difficulty Level: ${difficulty}.
    Personality Guidelines: ${getPersonalityGuidelines(personality)}.
    
    RULES:
    1. Always reply primarily in ${language.name}.
    2. Address the user by name occasionally: ${name}.
    3. Keep corrections minimal and natural. Do NOT be overly didactic unless Academic personality is chosen. 
    4. If the user makes a mistake, naturally model the correct phrasing.
    5. If the user says they don't understand or switches to English, gently guide them back to ${language.name}.
    6. Use standard Markdown for formatting.
  `;

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  contents.push({ role: 'user', parts: [{ text: userInput }] });

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "I'm sorry, I couldn't process that.",
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const extractSessionInsights = async (
  language: Language, 
  history: Message[], 
  userProfile?: UserProfile,
  existingVocab: VocabItem[] = []
) => {
  const model = 'gemini-3-flash-preview';
  const userName = userProfile?.displayName || 'the student';
  const assistantName = userProfile?.assistantName || 'Jerome';

  const knownWords = existingVocab
    .filter(v => v.languageCode === language.code && !v.mastered)
    .map(v => v.word)
    .join(', ');

  const prompt = `
    Based on the following conversation in ${language.name}, provide a structured JSON summary.
    
    CRITICAL INSTRUCTION: In the summary, you MUST refer to the student as "${userName}" and the AI tutor as "${assistantName}".
    
    Tasks:
    1. 2-3 sentence summary in English.
    2. Translation of that summary into ${language.name}.
    3. List 5-8 new vocabulary words learned.
    4. AUTO-MASTERY DETECTION: Look at the list of words the student previously struggled with: [${knownWords}]. 
       Identify which of these words the student correctly and naturally used in their own messages during this conversation.
    
    Conversation History:
    ${history.map(m => `${m.role}: ${m.content}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            translatedSummary: { type: Type.STRING },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  example: { type: Type.STRING }
                },
                required: ["word", "translation", "pronunciation", "example"]
              }
            },
            masteredWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of existing words from the knownWords list that the student used correctly."
            }
          },
          required: ["summary", "translatedSummary", "vocabulary", "masteredWords"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Insights extraction failed", error);
    return {
      summary: `${userName} and ${assistantName} had a conversation in ${language.name}.`,
      translatedSummary: "",
      vocabulary: [],
      masteredWords: []
    };
  }
};

export const generateTTS = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
