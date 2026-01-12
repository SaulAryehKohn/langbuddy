import React, { useState } from 'react';
import { UserProfile } from '../types';

interface Props {
  onAuth: (user: UserProfile) => void;
}

export const AuthForm: React.FC<Props> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mockUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      displayName: displayName || email.split('@')[0],
      email: email,
      targetLanguages: [],
      defaultDifficulty: 'Beginner',
      assistantName: 'Jerome',
      assistantPersonality: 'Encouraging',
      joinedDate: Date.now()
    };
    
    onAuth(mockUser);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 flex flex-col md:flex-row items-center justify-center gap-16 lg:gap-24">
      {/* Decorative Character (Matching the user's sketch) */}
      <div className="hidden lg:block w-1/3 animate-in slide-in-from-left-12 duration-1000">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="w-full text-blue-600 fill-none stroke-current stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
            <path d="M65 35c-2-15-18-25-35-22-15 3-24 18-22 33s18 25 33 22c5-1 9-3 12-6l12 8-3-15c8-6 13-14 13-20z" className="drop-shadow-xl" />
            <path d="M38 58c5 2 10 0 12-4" />
            <path d="M50 54c3 0 6-3 6-7" />
            <circle cx="35" cy="40" r="1.5" fill="currentColor" />
            <g className="animate-bounce" style={{ animationDuration: '3s' }}>
              <path d="M68 22c0-8 8-15 18-15s18 7 18 15-8 15-18 15c-3 0-6-1-9-2l-7 4 1-8c-2-1-3-3-3-4z" strokeWidth="2" />
              <circle cx="80" cy="20" r="1" fill="currentColor" stroke="none" />
              <circle cx="86" cy="20" r="1" fill="currentColor" stroke="none" />
              <circle cx="92" cy="20" r="1" fill="currentColor" stroke="none" />
            </g>
          </svg>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center w-full">
            <p className="text-blue-400 font-bold italic text-lg">"Bonjour ! Ready to chat?"</p>
          </div>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="h-2 bg-blue-600 w-full"></div>
          
          <div className="p-10 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-400 font-medium">Your personalized language path</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-gray-700"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-gray-700"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
              >
                {isLogin ? 'LOG IN' : 'SIGN UP'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-400 font-bold hover:text-blue-600 transition-colors text-sm"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};