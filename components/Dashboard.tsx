
import React, { useRef } from 'react';
import { UserProfile, SessionHistory, VocabItem, LANGUAGES } from '../types';

interface Props {
  user: UserProfile;
  history: SessionHistory[];
  vocab: VocabItem[];
  onStartSession: () => void;
  onViewVocab: () => void;
  onViewHistory: () => void;
  onViewSettings: () => void;
}

export const Dashboard: React.FC<Props> = ({ 
  user, history, vocab, onStartSession, onViewVocab, onViewHistory, onViewSettings 
}) => {
  const recentSessionsRef = useRef<HTMLDivElement>(null);
  
  const totalMinutes = history.reduce((acc, curr) => acc + curr.duration, 0);
  const masteredVocab = vocab.filter(v => v.mastered).length;
  
  const recentHistory = history.slice(0, 3);

  const scrollToRecent = () => {
    recentSessionsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 leading-tight">
            Welcome back, <span className="text-blue-600">{user.displayName}</span>!
          </h1>
          <p className="text-gray-500 text-lg font-medium">Ready for today's language journey?</p>
        </div>
        <button 
          onClick={onStartSession}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          START NEW SESSION
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Sessions', value: history.length, icon: '📅', color: 'bg-blue-50 text-blue-600', onClick: undefined },
          { label: 'Minutes Practiced', value: totalMinutes, icon: '⏱️', color: 'bg-emerald-50 text-emerald-600', onClick: undefined },
          { label: 'Words in Bank', value: vocab.length, icon: '📖', color: 'bg-indigo-50 text-indigo-600', onClick: scrollToRecent },
          { label: 'Words Mastered', value: masteredVocab, icon: '🏆', color: 'bg-amber-50 text-amber-600', onClick: onViewVocab },
        ].map((stat, idx) => (
          <div 
            key={idx} 
            onClick={stat.onClick}
            className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all ${stat.onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 group' : ''}`}
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div ref={recentSessionsRef} className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-gray-900">Recent Sessions</h2>
            <button onClick={onViewHistory} className="text-blue-600 font-bold text-sm hover:underline">View All</button>
          </div>
          
          {recentHistory.length > 0 ? (
            <div className="space-y-4">
              {recentHistory.map((session) => {
                const lang = LANGUAGES.find(l => l.code === session.languageCode);
                return (
                  <div key={session.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{lang?.flag}</div>
                      <div>
                        <h4 className="font-bold text-gray-900">{lang?.name} Session</h4>
                        <p className="text-xs text-gray-400 font-medium">
                          {new Date(session.timestamp).toLocaleDateString()} • {session.duration} mins • {session.difficulty}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={onViewVocab}
                      className="flex items-center gap-2 hover:bg-indigo-50 p-2 rounded-xl transition-all active:scale-95"
                    >
                       <span className="text-[10px] bg-indigo-50 text-indigo-600 font-black px-2 py-1 rounded-lg">+{session.vocabCount} words</span>
                       <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <p className="text-gray-400 font-medium">No sessions yet. Time to start your first one!</p>
            </div>
          )}
        </div>

        {/* Assistant Settings Quickview */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900">Your Companion</h2>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
             <div className="relative z-10">
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Current Partner</p>
                <h3 className="text-3xl font-black mb-1">{user.assistantName}</h3>
                <p className="text-white/60 font-medium text-sm mb-8">{user.assistantPersonality} Personality</p>
                
                <button 
                  onClick={onViewSettings}
                  className="w-full bg-white/20 backdrop-blur-md border border-white/20 rounded-xl py-3 text-sm font-bold hover:bg-white/30 transition-all"
                >
                  Customize Assistant
                </button>
             </div>
             {/* Abstract background shapes */}
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h4 className="font-bold text-gray-900 mb-2">Today's Tip</h4>
             <p className="text-gray-500 text-sm italic leading-relaxed">
               "Consistent practice is better than intense bursts. Even 10 minutes a day builds significant neural pathways for fluency."
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
