
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Message, VocabItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiChatResponse = async (
  language: Language,
  history: Message[],
  userInput: string
) => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are a friendly, encouraging language tutor named LinguistBuddy. 
    The user wants to practice ${language.name}. 
    
    RULES:
    1. Always reply primarily in ${language.name}.
    2. Detect the user's proficiency level (A1 to C2) and adjust your vocabulary and grammar complexity accordingly.
    3. If the user says they don't understand or switches to English, gently guide them back to ${language.name}. 
    4. Simplify your previous statement if they struggled. Rephrase naturally.
    5. Keep the vibe like a casual chat with a friend but with the expertise of a tutor.
    6. Include Google Search grounding if they ask about recent events or facts to provide up-to-date context in the target language.
  `;

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: userInput }]
  });

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

export const extractSessionInsights = async (language: Language, history: Message[]) => {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Based on the following conversation in ${language.name}, provide a structured JSON summary.
    
    Extract:
    1. 2-3 sentence summary of the conversation in English.
    2. A list of 5-8 new vocabulary words or phrases the user likely learned or struggled with.
    3. For each word, provide: translation, IPA/simplified pronunciation, and a short example sentence in ${language.name}.
    
    Conversation History:
    ${history.map(m => `${m.role}: ${m.content}`).join('\n')}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
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
          }
        },
        required: ["summary", "vocabulary"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const transcribeUserAudio = async (base64Audio: string) => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: 'audio/wav' } },
        { text: "Transcribe this audio exactly. Do not add any extra text." }
      ]
    }
  });
  return response.text;
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
