import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Language, Message, UserProfile, VocabItem } from '../types';
import { createBlob, decode, decodeAudioData, encode } from '../services/audioUtils';
import { getBridgeTranslation } from '../services/gemini';

interface Props {
  language: Language;
  userProfile: UserProfile;
  reviewWords?: VocabItem[];
  onEnd: (history: Message[]) => void;
  onSwitchToChat: () => void;
}

const BRIDGE_PHRASES: Record<string, string> = {
  fr: "Comment dit-on ___ ?",
  de: "Was ist ___ auf Deutsch?",
  es: "¿Cómo se dice ___ ?",
  it: "Come si dice ___ ?",
  jp: "___ は日本語で何と？",
  pt: "Como se diz ___ ?",
};

const LISTENING_PHRASES: Record<string, string> = {
  fr: "Je vous écoute...",
  de: "Ich höre zu...",
  es: "Te escucho...",
  it: "Ti ascolto...",
  jp: "聞いています...",
  pt: "Estou ouvindo...",
  gd: "Ag èisteachd...",
  cy: "Yn gwrando...",
  mi: "Kei te whakarongo...",
};

export const VoiceInterface: React.FC<Props> = ({ language, userProfile, reviewWords = [], onEnd, onSwitchToChat }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContexts = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTime = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Transcription Tracking
  const historyRef = useRef<Message[]>([]);
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  // Bridge State
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [bridgeInput, setBridgeInput] = useState('');
  const [bridgeResult, setBridgeResult] = useState<{translation: string, explanation: string} | null>(null);
  const [isBridgeLoading, setIsBridgeLoading] = useState(false);

  useEffect(() => {
    startSession();
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContexts.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const reviewInstruction = reviewWords.length > 0 
        ? `This is a REVIEW SESSION. Please help the student practice these specific words: ${reviewWords.map(v => v.word).join(', ')}. Try to naturally incorporate them into the conversation and prompt the student to use them.`
        : "";

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            
            sessionPromise.then(session => {
              session.sendRealtimeInput({ 
                media: { data: "", mimeType: 'audio/pcm;rate=16000' } 
              });
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscription.current += text;
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscription.current += text;
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputTranscription.current) {
                historyRef.current.push({ role: 'user', content: currentInputTranscription.current, timestamp: Date.now() });
                currentInputTranscription.current = '';
              }
              if (currentOutputTranscription.current) {
                historyRef.current.push({ role: 'assistant', content: currentOutputTranscription.current, timestamp: Date.now() });
                currentOutputTranscription.current = '';
              }
              setIsSpeaking(false);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const outCtx = audioContexts.current?.output!;
              nextStartTime.current = Math.max(nextStartTime.current, outCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              source.addEventListener('ended', () => {
                sources.current.delete(source);
                if (sources.current.size === 0) setIsSpeaking(false);
              });
              source.start(nextStartTime.current);
              nextStartTime.current += buffer.duration;
              sources.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sources.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sources.current.clear();
              nextStartTime.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => console.error("Live Error", e),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are ${userProfile.assistantName}, an expert language tutor. Student: ${userProfile.displayName}. Language: ${language.name}. Difficulty: ${userProfile.defaultDifficulty}. Personality: ${userProfile.assistantPersonality}. 
          ${reviewInstruction}
          Start the session IMMEDIATELY by greeting the student in ${language.name} and asking a simple question.`
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Failed to start voice session", error);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContexts.current) {
      audioContexts.current.input.close().catch(() => {});
      audioContexts.current.output.close().catch(() => {});
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

  const closeBridge = () => {
    setBridgeOpen(false);
    setBridgeInput('');
    setBridgeResult(null);
  };

  const handleEnd = () => {
    if (currentInputTranscription.current) historyRef.current.push({ role: 'user', content: currentInputTranscription.current, timestamp: Date.now() });
    if (currentOutputTranscription.current) historyRef.current.push({ role: 'assistant', content: currentOutputTranscription.current, timestamp: Date.now() });
    onEnd(historyRef.current);
  };

  const bridgeLabel = BRIDGE_PHRASES[language.code] || "How do you say... ?";
  const listeningText = LISTENING_PHRASES[language.code] || "Listening to you...";

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col text-white z-50 overflow-hidden">
      <div className={`absolute inset-0 transition-all duration-1000 opacity-20 ${isSpeaking ? 'bg-blue-600' : 'bg-emerald-600'}`}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950 opacity-80"></div>

      <header className="relative w-full px-8 py-4 md:py-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-2xl">
            {language.flag}
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight">{language.name} with {userProfile.assistantName}</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
              <span className="text-white/60 text-[10px] md:text-xs uppercase tracking-widest font-bold">
                {isConnecting ? 'Connecting...' : isActive ? 'Active Studio' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onSwitchToChat}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs md:text-sm font-medium transition-all"
        >
          Switch to Typing
        </button>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-start md:justify-center z-10 w-full px-6 overflow-y-auto min-h-0 pt-16 md:pt-8 pb-12">
        {isConnecting ? (
          <div className="flex flex-col items-center gap-6 mt-12 md:mt-0">
            <div className="w-24 h-24 md:w-32 md:h-32 relative">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium">Preparing your session...</p>
          </div>
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center">
            {/* Visual Hint Bridge Overlay */}
            {bridgeOpen && (
              <div className="absolute top-4 w-full px-4 z-30 transition-all duration-300">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-top-8 duration-300">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-lg font-black flex items-center gap-2">
                       🇬🇧 ➔ {language.flag}
                     </span>
                     <button onClick={closeBridge} className="text-white/40 hover:text-white p-1">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                  </div>
                  {!bridgeResult ? (
                    <div className="flex gap-2">
                       <input 
                         value={bridgeInput}
                         onChange={(e) => setBridgeInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleBridgeAction()}
                         placeholder=""
                         className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:bg-white/10 outline-none transition-all min-w-0"
                         autoFocus
                       />
                       <button 
                        onClick={handleBridgeAction} 
                        disabled={isBridgeLoading} 
                        className="bg-blue-500 text-white w-12 h-10 shrink-0 rounded-xl font-bold flex items-center justify-center disabled:opacity-50 transition-all active:scale-90"
                       >
                         {isBridgeLoading ? '...' : (
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                         )}
                       </button>
                    </div>
                  ) : (
                    <div className="text-center animate-in zoom-in duration-300">
                       <h4 className="text-3xl font-black text-white mb-2">{bridgeResult.translation}</h4>
                       <p className="text-white/60 text-sm font-medium italic">{bridgeResult.explanation}</p>
                       <button onClick={() => setBridgeResult(null)} className="mt-4 text-[10px] font-black uppercase text-blue-400">Try another thought</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="relative mb-8 md:mb-12 group pt-4">
              <div className={`absolute inset-0 -m-4 md:-m-8 bg-blue-500/20 rounded-full transition-transform duration-500 scale-125 blur-2xl ${isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
              <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isSpeaking ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-white/5 shadow-inner shadow-white/5'}`}>
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${isSpeaking ? 'border-blue-300 scale-110' : 'border-white/5 scale-100'}`}>
                   {isSpeaking ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-1.5 bg-blue-400 rounded-full animate-wave" style={{ height: '20px', animation: `wave 1s ease-in-out infinite ${i * 0.15}s` }}></div>
                        ))}
                      </div>
                   ) : (
                    <svg className="w-10 h-10 md:w-12 md:h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                   )}
                </div>
              </div>
            </div>

            <div className="text-center space-y-4 md:space-y-6 w-full">
              <h3 className="text-xl md:text-3xl font-black tracking-tight">
                {isSpeaking ? `${userProfile.assistantName} is speaking...` : listeningText}
              </h3>
              
              <button 
                onClick={() => setBridgeOpen(true)}
                className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group"
              >
                <span className="text-sm font-black uppercase tracking-widest">{bridgeLabel.replace('___', '...')}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="relative w-full flex flex-col items-center gap-3 z-20 shrink-0 p-8 pt-0">
        <button
          onClick={handleEnd}
          className="w-full max-w-xs py-3 md:py-4 bg-red-500 hover:bg-red-600 rounded-2xl font-black text-base md:text-lg tracking-wide transition-all shadow-xl shadow-red-900/40 active:scale-95"
        >
          END SESSION
        </button>
        <p className="text-white/40 text-[10px] md:text-xs font-medium text-center italic">
          Need help? Click the bridge above to translate a thought.
        </p>
      </footer>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 10px; }
          50% { height: 40px; }
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
