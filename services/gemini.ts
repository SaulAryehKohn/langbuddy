
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Message, VocabItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateInitialGreeting = async (language: Language) => {
  const model = 'gemini-3-flash-preview';
  const prompt = `You are a friendly language tutor. Generate a single, very short opening sentence in ${language.name} to start a conversation with a new student. 
  Keep it extremely simple (A1 level). 
  Example: "Bonjour ! Comment ça va aujourd'hui ?" or "¡Hola! ¿Cómo te llamas?". 
  Return ONLY the ${language.name} text, no translation.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || `Hello! Let's practice ${language.name}.`;
  } catch (error) {
    console.error("Greeting Generation Error:", error);
    return `Hello! Let's practice ${language.name}.`;
  }
};

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
    2. Keep corrections minimal and natural. Do NOT be overly didactic or provide numbered lists of errors. 
    3. If the user makes a mistake, naturally model the correct phrasing in your response rather than listing rules.
    4. If a specific tip is absolutely necessary, provide exactly ONE brief, encouraging suggestion per response.
    5. Detect the user's proficiency level (A1 to C2) and adjust your vocabulary and grammar complexity to match or be slightly above theirs.
    6. If the user says they don't understand or switches to English, gently guide them back to ${language.name} with simplified language.
    7. Keep the vibe like a casual chat with a friend who happens to be a supportive teacher.
    8. Use standard Markdown for formatting (e.g., **bold** for emphasis on specific words or corrections).
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