
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Language, Message } from '../types';
import { createBlob, decode, decodeAudioData, encode } from '../services/audioUtils';

interface Props {
  language: Language;
  onEnd: (history: Message[]) => void;
  onSwitchToChat: () => void;
}

export const VoiceInterface: React.FC<Props> = ({ language, onEnd, onSwitchToChat }) => {
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
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputTranscription.current) {
                historyRef.current.push({
                  role: 'user',
                  content: currentInputTranscription.current,
                  timestamp: Date.now()
                });
                currentInputTranscription.current = '';
              }
              if (currentOutputTranscription.current) {
                historyRef.current.push({
                  role: 'assistant',
                  content: currentOutputTranscription.current,
                  timestamp: Date.now()
                });
                currentOutputTranscription.current = '';
              }
              setIsSpeaking(false);
            }

            // Handle Audio
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
              sources.current.forEach(s => s.stop());
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
          systemInstruction: `You are LinguistBuddy, an encouraging ${language.name} tutor. Talk naturally in ${language.name}. Adjust your speed and vocabulary to the user's level. Gently rephrase if they don't understand. Start by greeting them and asking how their day is going.`
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Failed to start voice session", error);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContexts.current) {
      audioContexts.current.input.close();
      audioContexts.current.output.close();
    }
  };

  const handleEnd = () => {
    if (currentInputTranscription.current) {
      historyRef.current.push({ role: 'user', content: currentInputTranscription.current, timestamp: Date.now() });
    }
    if (currentOutputTranscription.current) {
      historyRef.current.push({ role: 'assistant', content: currentOutputTranscription.current, timestamp: Date.now() });
    }
    onEnd(historyRef.current);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col text-white z-50 overflow-hidden">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 transition-all duration-1000 opacity-20 ${isSpeaking ? 'bg-blue-600' : 'bg-emerald-600'}`}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950 opacity-80"></div>

      {/* Header Section */}
      <header className="relative w-full px-8 py-4 md:py-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-2xl">
            {language.flag}
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight">{language.name} Session</h2>
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

      {/* Main Studio Area - Increased pt-16 to ensure visualization is clear of the header */}
      <main className="relative flex-1 flex flex-col items-center justify-start md:justify-center z-10 w-full px-6 overflow-y-auto min-h-0 pt-16 md:pt-8 pb-12">
        {isConnecting ? (
          <div className="flex flex-col items-center gap-6 mt-12 md:mt-0">
            <div className="w-24 h-24 md:w-32 md:h-32 relative">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-lg md:text-xl font-medium mb-1">Preparing your session</p>
              <p className="text-white/40 text-xs md:text-sm">Initializing LinguistBuddy AI...</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center">
            {/* Pulsing Voice Core */}
            <div className="relative mb-8 md:mb-12 group pt-4">
              {/* Voice Visualization Circles - Glow scale slightly reduced for safety */}
              <div className={`absolute inset-0 -m-4 md:-m-8 bg-blue-500/20 rounded-full transition-transform duration-500 scale-125 blur-2xl ${isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
              
              <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isSpeaking ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-white/5 shadow-inner shadow-white/5'}`}>
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${isSpeaking ? 'border-blue-300 scale-110' : 'border-white/5 scale-100'}`}>
                   {isSpeaking ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i} 
                            className="w-1.5 bg-blue-400 rounded-full animate-wave"
                            style={{ 
                              height: '20px',
                              animation: `wave 1s ease-in-out infinite ${i * 0.15}s`
                            }}
                          ></div>
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
                {isSpeaking ? "LinguistBuddy is speaking..." : "Listening to you..."}
              </h3>
              
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl w-full">
                 <p className="text-white/80 font-medium mb-3 text-sm md:text-base">Practice Ideas:</p>
                 <ul className="text-white/50 text-xs md:text-sm space-y-3 text-left">
                    <li className="flex items-start gap-2 italic leading-relaxed">
                      <span className="text-blue-400 mt-1">•</span>
                      "What are some common phrases for ordering food?"
                    </li>
                    <li className="flex items-start gap-2 italic leading-relaxed">
                      <span className="text-blue-400 mt-1">•</span>
                      "Can we talk about the weather in {language.name}?"
                    </li>
                    <li className="flex items-start gap-2 italic leading-relaxed">
                      <span className="text-blue-400 mt-1">•</span>
                      "I don't understand, can you say that slowly?"
                    </li>
                 </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Section */}
      <footer className="relative w-full flex flex-col items-center gap-3 z-20 shrink-0 p-8 pt-0">
        <button
          onClick={handleEnd}
          className="w-full max-w-xs py-3 md:py-4 bg-red-500 hover:bg-red-600 rounded-2xl font-black text-base md:text-lg tracking-wide transition-all shadow-xl shadow-red-900/40 active:scale-95"
        >
          END SESSION
        </button>
        <p className="text-white/40 text-[10px] md:text-xs font-medium text-center">
          Your session will be summarized into a friendly PDF report
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
