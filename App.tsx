
import React, { useState, useEffect } from 'react';
import { AppState, Language, Message, SessionData, UserProfile, SessionHistory, VocabItem, LANGUAGES } from './types';
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
  const [reviewMode, setReviewMode] = useState(false);

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

  const startSession = (langCode?: string, isReview: boolean = false) => {
    if (langCode) {
      const lang = LANGUAGES.find(l => l.code === langCode);
      if (lang) {
        setSelectedLanguage(lang);
        setReviewMode(isReview);
        setState(AppState.LIVE_VOICE);
        return;
      }
    }
    setReviewMode(false);
    setState(AppState.SETUP);
  };

  const endSession = (messages: Message[]) => {
    if (!selectedLanguage || !user) return;
    
    const hasUserSpoken = messages.some(m => m.role === 'user');
    
    if (!hasUserSpoken) {
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

  const handleSummaryComplete = (finalData: SessionData & { masteredWords: string[] }) => {
    if (!user || !selectedLanguage) return;
    
    const newSession: SessionHistory = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      languageCode: selectedLanguage.code,
      timestamp: Date.now(),
      duration: Math.ceil(finalData.messages.length * 0.5),
      difficulty: user.defaultDifficulty,
      summary: finalData.summary,
      messages: finalData.messages,
      vocabCount: finalData.vocabulary.length
    };
    
    db.saveSession(newSession);
    
    // 1. Process SRS updates for correctly used words
    if (finalData.masteredWords && finalData.masteredWords.length > 0) {
      db.updateSRS(finalData.masteredWords, selectedLanguage.code, true);
    }

    // 2. Save new vocabulary bank items
    const newVocabItems: VocabItem[] = finalData.vocabulary.map(v => ({
      ...v,
      languageCode: selectedLanguage.code,
      dateAdded: Date.now()
    }));
    db.saveVocab(newVocabItems);
    
    // Refresh UI state
    setHistory(db.getHistory(user.id));
    setVocab(db.getVocab(user.id));
    setReviewMode(false);
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
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b z-40 px-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => user ? setState(AppState.DASHBOARD) : setState(AppState.AUTH)}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
             <svg viewBox="0 0 100 100" className="w-7 h-7 text-white fill-none stroke-current stroke-[6] stroke-linecap-round stroke-linejoin-round">
               <path d="M70 40c0-16.5-13.5-30-30-30s-30 13.5-30 30c0 10.5 5.5 19.5 14 25L20 80l15-7c5 3 10.5 4.5 16 4.5" stroke="currentColor" />
               <path d="M55 55l10 10h20V45H75l-10 10z" fill="white" stroke="none" />
               <path d="M65 55l10-10h15v20H75l-10-10z" stroke="currentColor" fill="none" />
               <circle cx="35" cy="35" r="2" fill="currentColor" />
               <path d="M40 50c3 0 6-2 6-5" stroke="currentColor" />
             </svg>
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">Jero<span className="text-blue-600">me</span></span>
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

      <main className="pt-16 pb-20">
        {state === AppState.AUTH && (
          <AuthForm onAuth={handleAuth} />
        )}

        {state === AppState.DASHBOARD && user && (
          <Dashboard 
            user={user} 
            history={history} 
            vocab={vocab}
            onStartSession={startSession}
            onViewVocab={() => setState(AppState.VOCAB_BANK)}
            onViewHistory={() => setState(AppState.DASHBOARD)}
            onViewSettings={() => setState(AppState.SETTINGS)}
          />
        )}

        {state === AppState.SETUP && (
          <LanguageSelector onSelect={(lang) => startSession(lang.code)} />
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
            reviewWords={reviewMode ? db.getDueVocab(user.id, selectedLanguage.code) : []}
            onEnd={(history) => endSession(history)}
            onSwitchToChat={() => setState(AppState.CHAT)}
          />
        )}

        {state === AppState.SUMMARY && sessionData && user && (
          <SummaryView 
            session={sessionData} 
            userProfile={user}
            existingVocab={vocab}
            onRestart={() => setState(AppState.DASHBOARD)} 
            onComplete={handleSummaryComplete}
          />
        )}
      </main>
    </div>
  );
};

export default App;
