
import React, { useState } from 'react';
import { UserProfile, Personality, Difficulty, LANGUAGES } from '../types';

interface Props {
  user: UserProfile;
  onSave: (updated: UserProfile) => void;
  onBack: () => void;
  onLogout: () => void;
}

export const Settings: React.FC<Props> = ({ user, onSave, onBack, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile>({...user});

  const handleSave = () => {
    onSave(profile);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 font-bold transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-black text-gray-900">Settings</h1>
      </div>

      <div className="space-y-12">
        {/* User Profile */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
             <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">👤</span>
             User Profile
          </h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Display Name</label>
              <input 
                type="text" 
                value={profile.displayName}
                onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Default Difficulty</label>
              <select 
                value={profile.defaultDifficulty}
                onChange={(e) => setProfile({...profile, defaultDifficulty: e.target.value as Difficulty})}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Auto-adapt">Auto-adapt (Smart)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Assistant Personalization */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
             <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">🤖</span>
             Assistant Customization
          </h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Assistant Name</label>
              <input 
                type="text" 
                value={profile.assistantName}
                onChange={(e) => setProfile({...profile, assistantName: e.target.value})}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Personality Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Encouraging', 'Direct', 'Playful', 'Academic'] as Personality[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProfile({...profile, assistantPersonality: p})}
                    className={`p-4 rounded-xl border text-sm font-bold transition-all ${
                      profile.assistantPersonality === p 
                      ? 'border-blue-600 bg-blue-50 text-blue-600 ring-1 ring-blue-600' 
                      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="pt-8 border-t border-gray-100 flex flex-col gap-4">
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            SAVE CHANGES
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full bg-white text-red-500 border border-red-100 py-3 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all"
          >
            Logout & Clear Data
          </button>
        </div>
      </div>
    </div>
  );
};
