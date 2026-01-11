
import React, { useState, useEffect } from 'react';
import { AppState, Language, Message, SessionData, UserProfile, SessionHistory, VocabItem } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { ChatInterface } from './components/ChatInterface';
import { VoiceInterface } from './components/VoiceInterface';
import { SummaryView } from './components/SummaryView';
import { Dashboard } from './components/Dashboard';
import { AuthForm } from './components/AuthForm';
import { Settings } from './components/Settings';
import { VocabBank } from './components/VocabBank';
import { db } from './services/dbService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.AUTH);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    const savedUser = db.getUser();
    if (savedUser) {
      setUser(savedUser);
      setHistory(db.getHistory(savedUser.id));
      setVocab(db.getVocab(savedUser.id));
      setState(AppState.DASHBOARD);
    }
  }, []);

  const handleAuth = (newUser: UserProfile) => {
    setUser(newUser);
    db.saveUser(newUser);
    setHistory(db.getHistory(newUser.id));
    setVocab(db.getVocab(newUser.id));
    setState(AppState.DASHBOARD);
  };

  const startSession = (lang: Language) => {
    setSelectedLanguage(lang);
    // Defaults to Voice Interface per request
    setState(AppState.LIVE_VOICE);
  };

  const endSession = (messages: Message[]) => {
    if (!selectedLanguage || !user) return;
    
    // Check if the user has actually contributed to the session
    const hasUserSpoken = messages.some(m => m.role === 'user');
    
    if (!hasUserSpoken) {
      // If the user ended session before speaking, just go back to dashboard
      setState(AppState.DASHBOARD);
      return;
    }

    setSessionData({
      language: selectedLanguage,
      messages: messages,
      vocabulary: [],
      summary: ''
    });
    setState(AppState.SUMMARY);
  };

  const handleSummaryComplete = (finalData: SessionData) => {
    if (!user || !selectedLanguage) return;
    
    // Save to history
    const newSession: SessionHistory = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      languageCode: selectedLanguage.code,
      timestamp: Date.now(),
      duration: Math.ceil(finalData.messages.length * 0.5), // Rough estimate
      difficulty: user.defaultDifficulty,
      summary: finalData.summary,
      messages: finalData.messages,
      vocabCount: finalData.vocabulary.length
    };
    
    db.saveSession(newSession);
    
    // Save to vocab bank
    const newVocabItems: VocabItem[] = finalData.vocabulary.map(v => ({
      ...v,
      languageCode: selectedLanguage.code,
      dateAdded: Date.now()
    }));
    db.saveVocab(newVocabItems);
    
    // Update local state
    setHistory(db.getHistory(user.id));
    setVocab(db.getVocab(user.id));
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setHistory([]);
    setVocab([]);
    setState(AppState.AUTH);
  };

  const saveSettings = (updated: UserProfile) => {
    setUser(updated);
    db.saveUser(updated);
    setState(AppState.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b z-40 px-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => user ? setState(AppState.DASHBOARD) : setState(AppState.AUTH)}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5h12M9 3v2m1.042 3.99c-1.101 1.01-2.73 1.451-4.752 1.451L4 13h4.5m10.344-1V7m0 0l-2 3m2-3l2 3M8 19l4.5-8.6L17 19M5 11l.5-1.3" />
             </svg>
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">LinguistBuddy<span className="text-blue-600">AI</span></span>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setState(AppState.VOCAB_BANK)}
              className="text-gray-400 hover:text-blue-600 transition-colors hidden sm:block font-bold text-sm"
            >
              Vocab
            </button>
            <button 
              onClick={() => setState(AppState.SETTINGS)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-all"
            >
              <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">
                {user.displayName.charAt(0)}
              </div>
              <span className="text-xs font-black text-gray-600 hidden md:inline">{user.displayName}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="pt-16 pb-20">
        {state === AppState.AUTH && (
          <AuthForm onAuth={handleAuth} />
        )}

        {state === AppState.DASHBOARD && user && (
          <Dashboard 
            user={user} 
            history={history} 
            vocab={vocab}
            onStartSession={() => setState(AppState.SETUP)}
            onViewVocab={() => setState(AppState.VOCAB_BANK)}
            onViewHistory={() => setState(AppState.DASHBOARD)}
            onViewSettings={() => setState(AppState.SETTINGS)}
          />
        )}

        {state === AppState.SETUP && (
          <LanguageSelector onSelect={startSession} />
        )}

        {state === AppState.SETTINGS && user && (
          <Settings 
            user={user} 
            onSave={saveSettings} 
            onBack={() => setState(AppState.DASHBOARD)}
            onLogout={logout}
          />
        )}

        {state === AppState.VOCAB_BANK && user && (
          <VocabBank 
            vocab={vocab} 
            onBack={() => setState(AppState.DASHBOARD)}
            onToggleMastery={(w, l) => {
              db.toggleVocabMastery(w, l);
              setVocab(db.getVocab(user.id));
            }}
          />
        )}

        {state === AppState.CHAT && selectedLanguage && user && (
          <ChatInterface 
            language={selectedLanguage} 
            userProfile={user}
            onEnd={endSession} 
            onSwitchToVoice={() => setState(AppState.LIVE_VOICE)}
          />
        )}

        {state === AppState.LIVE_VOICE && selectedLanguage && user && (
          <VoiceInterface 
            language={selectedLanguage} 
            userProfile={user}
            onEnd={(history) => endSession(history)}
            onSwitchToChat={() => setState(AppState.CHAT)}
          />
        )}

        {state === AppState.SUMMARY && sessionData && user && (
          <SummaryView 
            session={sessionData} 
            userProfile={user}
            onRestart={() => setState(AppState.DASHBOARD)} 
            onComplete={handleSummaryComplete}
          />
        )}
      </main>
    </div>
  );
};

export default App;
