import React, { useState, useRef, useEffect } from 'react';
import { Language, Message, UserProfile } from '../types';
import { getGeminiChatResponse, generateTTS, generateInitialGreeting, getBridgeTranslation } from '../services/gemini';
import { decode, decodeAudioData } from '../services/audioUtils';
import { marked } from 'marked';

interface Props {
  language: Language;
  userProfile: UserProfile;
  onEnd: (history: Message[]) => void;
  onSwitchToVoice: () => void;
}

const BRIDGE_PHRASES: Record<string, string> = {
  fr: "Comment dit-on ___ en français ?",
  de: "Was ist ___ auf Deutsch ?",
  es: "¿Cómo se dice ___ en español ?",
  it: "Come si dice ___ in italiano ?",
  jp: "___ は日本語で何と言いますか？",
  pt: "Como se diz ___ em português ?",
  gd: "Ciamar a chanas tu ___ ann an Gàidhlig ?",
  cy: "Sut ydych chi'n dweud ___ yn Gymraeg ?",
  mi: "Me pēhea te kī ___ ki te reo Māori ?",
};

const TYPE_IN_PHRASES: Record<string, string> = {
  fr: "Écrivez en français...",
  de: "Schreiben Sie auf Deutsch...",
  es: "Escribe en español...",
  it: "Scrivi in italiano...",
  jp: "日本語で入力してください...",
  pt: "Escreva em português...",
  gd: "Sgrìobh ann an Gàidhlig...",
  cy: "Ysgrifennwch yn Gymraeg...",
  mi: "Tuhi ki te reo Māori...",
};

export const ChatInterface: React.FC<Props> = ({ language, userProfile, onEnd, onSwitchToVoice }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContext = useRef<AudioContext | null>(null);

  // Bridge State
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [bridgeInput, setBridgeInput] = useState('');
  const [bridgeResult, setBridgeResult] = useState<{translation: string, explanation: string} | null>(null);
  const [isBridgeLoading, setIsBridgeLoading] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      setIsInitializing(true);
      try {
        const greetingText = await generateInitialGreeting(language, userProfile);
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
      const response = await getGeminiChatResponse(language, [...messages, userMsg], input, userProfile);
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: response.text, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, assistantMsg]);
      playTTS(assistantMsg.content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBridgeAction = async () => {
    if (!bridgeInput.trim()) return;
    setIsBridgeLoading(true);
    try {
      const result = await getBridgeTranslation(bridgeInput, language, userProfile.defaultDifficulty);
      setBridgeResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsBridgeLoading(false);
    }
  };

  const useBridgeTranslation = () => {
    if (bridgeResult) {
      setInput(prev => prev + (prev ? ' ' : '') + bridgeResult.translation);
      closeBridge();
    }
  };

  const closeBridge = () => {
    setBridgeOpen(false);
    setBridgeInput('');
    setBridgeResult(null);
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

  const bridgeLabel = BRIDGE_PHRASES[language.code] || "How do you say ___?";
  const placeholderText = TYPE_IN_PHRASES[language.code] || `Type in ${language.name}...`;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white shadow-2xl rounded-3xl overflow-hidden mt-8 relative border border-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl shadow-inner">
            {language.flag}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{language.name} with {userProfile.assistantName}</h3>
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

      {/* Input & Bridge */}
      <div className="relative p-4 bg-white border-t border-gray-100 z-20">
        {/* Bridge UI Overlay */}
        {bridgeOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-8 px-4 animate-in slide-in-from-bottom-4 duration-300 z-30">
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
               <div className="p-4 bg-blue-50/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black flex items-center gap-1.5">
                      🇬🇧 ➔ {language.flag}
                    </span>
                    <button onClick={closeBridge} className="text-gray-400 hover:text-gray-600 p-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  {!bridgeResult ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={bridgeInput}
                        onChange={(e) => setBridgeInput(e.target.value)}
                        placeholder=""
                        onKeyDown={(e) => e.key === 'Enter' && handleBridgeAction()}
                        className="flex-1 bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none min-w-0"
                        autoFocus
                      />
                      <button 
                        onClick={handleBridgeAction}
                        disabled={isBridgeLoading || !bridgeInput.trim()}
                        className="bg-blue-600 text-white w-12 h-10 shrink-0 rounded-xl text-lg flex items-center justify-center disabled:opacity-50 transition-all active:scale-90"
                      >
                        {isBridgeLoading ? '...' : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-500">
                       <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <p className="text-lg font-black text-gray-900">{bridgeResult.translation}</p>
                          <p className="text-xs text-gray-400 mt-1 italic">{bridgeResult.explanation}</p>
                       </div>
                       <div className="flex gap-2">
                         <button 
                           onClick={useBridgeTranslation}
                           className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition-all"
                         >
                           USE THIS PHRASE
                         </button>
                         <button 
                           onClick={() => setBridgeResult(null)}
                           className="bg-white border border-gray-200 text-gray-400 py-2 px-4 rounded-xl text-xs font-black hover:bg-gray-50 transition-all"
                         >
                           TRY AGAIN
                         </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Floating Bridge Trigger */}
        <button 
          onClick={() => bridgeOpen ? closeBridge() : setBridgeOpen(true)}
          className={`absolute -top-14 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full border shadow-xl transition-all flex items-center gap-2 whitespace-nowrap z-20 ${
            bridgeOpen 
            ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-50' 
            : 'bg-white text-blue-600 border-blue-100 hover:border-blue-300'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest">
            {bridgeLabel.replace('___', '...')}
          </span>
        </button>

        <div className="flex gap-3 relative z-10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isInitializing ? "Waiting for Jerome..." : placeholderText}
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
      </div>
    </div>
  );
};
