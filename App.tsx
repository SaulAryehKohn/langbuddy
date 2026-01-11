
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="yellow">
              <path fill-rule="evenodd" d="M9 2.25a.75.75 0 0 1 .75.75v1.506a49.384 49.384 0 0 1 5.343.371.75.75 0 1 1-.186 1.489c-.66-.083-1.323-.151-1.99-.206a18.67 18.67 0 0 1-2.97 6.323c.318.384.65.753 1 1.107a.75.75 0 0 1-1.07 1.052A18.902 18.902 0 0 1 9 13.687a18.823 18.823 0 0 1-5.656 4.482.75.75 0 0 1-.688-1.333 17.323 17.323 0 0 0 5.396-4.353A18.72 18.72 0 0 1 5.89 8.598a.75.75 0 0 1 1.388-.568A17.21 17.21 0 0 0 9 11.224a17.168 17.168 0 0 0 2.391-5.165 48.04 48.04 0 0 0-8.298.307.75.75 0 0 1-.186-1.489 49.159 49.159 0 0 1 5.343-.371V3A.75.75 0 0 1 9 2.25ZM15.75 9a.75.75 0 0 1 .68.433l5.25 11.25a.75.75 0 1 1-1.36.634l-1.198-2.567h-6.744l-1.198 2.567a.75.75 0 0 1-1.36-.634l5.25-11.25A.75.75 0 0 1 15.75 9Zm-2.672 8.25h5.344l-2.672-5.726-2.672 5.726Z" clip-rule="evenodd" />
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
