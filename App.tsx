
import React, { useState } from 'react';
import { AppState, Language, Message, SessionData } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { ChatInterface } from './components/ChatInterface';
import { VoiceInterface } from './components/VoiceInterface';
import { SummaryView } from './components/SummaryView';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.SETUP);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const startSession = (lang: Language) => {
    setSelectedLanguage(lang);
    // Setting Live Voice as the default starting mode
    setState(AppState.LIVE_VOICE);
  };

  const endSession = (history: Message[]) => {
    if (!selectedLanguage) return;
    setSessionData({
      language: selectedLanguage,
      messages: history,
      vocabulary: [],
      summary: '',
      grammarPoints: []
    });
    setState(AppState.SUMMARY);
  };

  const restart = () => {
    setState(AppState.SETUP);
    setSelectedLanguage(null);
    setSessionData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b z-40 px-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={restart}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5h12M9 3v2m1.042 3.99c-1.101 1.01-2.73 1.451-4.752 1.451L4 13h4.5m10.344-1V7m0 0l-2 3m2-3l2 3M8 19l4.5-8.6L17 19M5 11l.5-1.3" />
            </svg>
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">LinguistBuddy<span className="text-blue-600">AI</span></span>
        </div>
        
        {selectedLanguage && state !== AppState.SETUP && (
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
            <span className="text-sm">{selectedLanguage.flag}</span>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{selectedLanguage.name}</span>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="pt-16 pb-20">
        {state === AppState.SETUP && (
          <LanguageSelector onSelect={startSession} />
        )}

        {state === AppState.CHAT && selectedLanguage && (
          <ChatInterface 
            language={selectedLanguage} 
            onEnd={endSession} 
            onSwitchToVoice={() => setState(AppState.LIVE_VOICE)}
          />
        )}

        {state === AppState.LIVE_VOICE && selectedLanguage && (
          <VoiceInterface 
            language={selectedLanguage} 
            onEnd={(history) => endSession(history)}
            onSwitchToChat={() => setState(AppState.CHAT)}
          />
        )}

        {state === AppState.SUMMARY && sessionData && (
          <SummaryView session={sessionData} onRestart={restart} />
        )}
      </main>
    </div>
  );
};

export default App;
