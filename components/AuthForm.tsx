
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface Props {
  onAuth: (user: UserProfile) => void;
}

const GREETINGS = [
  { text: "Ready to start your journey?", color: "text-blue-600", bg: "bg-blue-500", shadow: "shadow-blue-200" },
  { text: "Prêt à commencer votre voyage ?", color: "text-emerald-600", bg: "bg-emerald-500", shadow: "shadow-emerald-200" },
  { text: "¿Listo para comenzar tu viaje?", color: "text-amber-600", bg: "bg-amber-500", shadow: "shadow-amber-200" },
  { text: "Bereit, deine Reise zu beginnen?", color: "text-rose-600", bg: "bg-rose-500", shadow: "shadow-rose-200" },
  { text: "Pronto per iniziare il tuo viaggio?", color: "text-indigo-600", bg: "bg-indigo-500", shadow: "shadow-indigo-200" },
  { text: "旅を始める準備はできていますか？", color: "text-pink-600", bg: "bg-pink-500", shadow: "shadow-pink-200" },
  { text: "Pronto para começar sua jornada?", color: "text-orange-600", bg: "bg-orange-500", shadow: "shadow-orange-200" },
  { text: "Deiseil airson do thuras a thòiseachadh?", color: "text-cyan-600", bg: "bg-cyan-500", shadow: "shadow-cyan-200" },
  { text: "Yn barod i ddechrau eich taith?", color: "text-red-600", bg: "bg-red-500", shadow: "shadow-red-200" },
  { text: "Kua rite ki te tīmata i tō haerenga?", color: "text-lime-600", bg: "bg-lime-500", shadow: "shadow-lime-200" },
];

// The invitation code is "Jerome-Beta-2025"
const VALID_CODE_ENCODED = "SmVyb21lLUJldGEtMjAyNQ=="; 

export const AuthForm: React.FC<Props> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [greetingIdx, setGreetingIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIdx((prev) => (prev + 1) % GREETINGS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      try {
        const inputCode = accessCode.trim();
        const decodedRequired = atob(VALID_CODE_ENCODED);
        
        if (inputCode !== decodedRequired) {
          setError('Invalid Access Code. Please contact developer for entry.');
          setIsLoading(false);
          return;
        }

        // Extract display name from email (part before @)
        const emailPrefix = email.split('@')[0];
        const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

        const mockUser: UserProfile = {
          id: Math.random().toString(36).substr(2, 9),
          displayName: displayName,
          email: email,
          targetLanguages: [],
          defaultDifficulty: 'Beginner',
          assistantName: 'Jerome',
          assistantPersonality: 'Encouraging',
          joinedDate: Date.now()
        };
        
        onAuth(mockUser);
      } catch (err) {
        setError('Verification failed. Please check your credentials.');
      } finally {
        setIsLoading(false);
      }
    }, 600);
  };

  const currentGreeting = GREETINGS[greetingIdx];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32 min-h-[80vh]">
      {/* Dynamic Multilingual Greeting Animation */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center relative min-h-[500px]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`absolute w-[450px] h-[450px] rounded-full blur-[100px] opacity-10 animate-pulse transition-all duration-1000 ${currentGreeting.bg}`}></div>
            <div className={`absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-15 animate-bounce transition-all duration-[6000ms] ${currentGreeting.bg}`} style={{ animationDelay: '0.5s', transform: 'translate(10%, -10%)' }}></div>
            <div className={`absolute w-[350px] h-[350px] rounded-full blur-[90px] opacity-10 transition-all duration-[8000ms] ${currentGreeting.bg}`} style={{ animation: 'pulse 10s infinite alternate', transform: 'translate(-20%, 20%)' }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
            <div className="text-center w-full px-8 overflow-hidden">
                <h1 
                    key={currentGreeting.text} 
                    className={`text-6xl xl:text-8xl font-black mb-4 ${currentGreeting.color} tracking-tight leading-[1.05] drop-shadow-sm flex flex-wrap justify-center`}
                >
                    {currentGreeting.text.split(' ').map((word, i) => (
                      <span 
                        key={i} 
                        className={`inline-block mr-4 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-500 fill-mode-both`} 
                        style={{ 
                          animationDelay: `${i * 120}ms`,
                          transform: `rotate(${i % 2 === 0 ? '-2' : '2'}deg)`
                        }}
                      >
                        {word}
                      </span>
                    ))}
                </h1>
            </div>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md shrink-0 relative z-20">
        <div className="bg-white rounded-[3.5rem] shadow-[0_48px_80px_-16px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-12 duration-1000">
          <div className={`h-4 w-full transition-colors duration-1000 ${currentGreeting.bg}`}></div>
          
          <div className="p-10 md:p-14">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-400 font-medium text-lg leading-relaxed">Enter your access code to continue testing.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold animate-bounce flex items-center gap-3 border border-red-100">
                   <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] ml-2">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] ml-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-2">
                   <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Access Code</label>
                   <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter Beta Code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-[1.5rem] px-6 py-5 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all font-bold text-blue-600 placeholder:text-blue-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white py-6 rounded-[1.5rem] font-black text-xl shadow-2xl transition-all active:scale-95 hover:-translate-y-1.5 flex items-center justify-center gap-3 ${isLoading ? 'opacity-70' : ''} ${currentGreeting.bg} ${currentGreeting.shadow.replace('200', '400')}`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  isLogin ? 'SIGN IN' : 'JOIN BETA'
                )}
              </button>
            </form>

            <div className="mt-12 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="group inline-flex items-center gap-2 text-gray-400 font-black hover:text-blue-600 transition-colors text-xs uppercase tracking-widest"
              >
                <span>{isLogin ? "No account?" : "Already testing?"}</span>
                <span className="text-blue-500 underline decoration-2 underline-offset-4 group-hover:no-underline">
                  {isLogin ? "Join Beta" : "Log in"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
