
import React, { useState, useRef, useEffect } from 'react';
import { Language, Message } from '../types';
import { getGeminiChatResponse, generateTTS, generateInitialGreeting } from '../services/gemini';
import { decode, decodeAudioData } from '../services/audioUtils';
import { marked } from 'marked';

interface Props {
  language: Language;
  onEnd: (history: Message[]) => void;
  onSwitchToVoice: () => void;
}

export const ChatInterface: React.FC<Props> = ({ language, onEnd, onSwitchToVoice }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContext = useRef<AudioContext | null>(null);

  // Initialize conversation with a dynamic greeting
  useEffect(() => {
    const initChat = async () => {
      setIsInitializing(true);
      try {
        const greetingText = await generateInitialGreeting(language);
        const initialMsg: Message = {
          role: 'assistant',
          content: greetingText,
          timestamp: Date.now()
        };
        setMessages([initialMsg]);
        playTTS(greetingText);
      } catch (error) {
        console.error("Failed to initialize chat", error);
      } finally {
        setIsInitializing(false);
      }
    };
    initChat();
  }, [language]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isLoading, isInitializing]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getGeminiChatResponse(language, [...messages, userMsg], input);
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: response.text, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, assistantMsg]);
      
      // Auto TTS for assistant response
      playTTS(response.text);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      const base64Audio = await generateTTS(text);
      if (base64Audio) {
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const buffer = await decodeAudioData(decode(base64Audio), audioContext.current, 24000, 1);
        const source = audioContext.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.current.destination);
        source.start();
      }
    } catch (e) {
      console.warn("TTS Failed", e);
    }
  };

  const renderMessageContent = (content: string) => {
    const html = marked.parse(content, { gfm: true, breaks: true }) as string;
    return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white shadow-2xl rounded-3xl overflow-hidden mt-8 relative border border-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl shadow-inner">
            {language.flag}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{language.name} Practice</h3>
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live Session
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onSwitchToVoice}
            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
            title="Switch to Voice Mode"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button 
            onClick={() => onEnd(messages)}
            className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors active:scale-95 text-sm"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30"
      >
        {isInitializing && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-gray-100 px-5 py-3.5 rounded-2xl rounded-tl-none">
              <p className="text-gray-400 italic text-sm">Thinking of a greeting...</p>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {renderMessageContent(msg.content)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isInitializing ? "Waiting for LinguistBuddy..." : `Type in ${language.name}...`}
            disabled={isInitializing}
            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium text-gray-700 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isInitializing}
            className="bg-blue-600 text-white p-3.5 rounded-2xl hover:bg-blue-700 disabled:bg-gray-200 transition-all shadow-xl shadow-blue-200 active:scale-95 group"
          >
            <svg className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Stuck? Switch to English anytime
          </p>
        </div>
      </div>
    </div>
  );
};