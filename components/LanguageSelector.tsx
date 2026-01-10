
import React from 'react';
import { LANGUAGES, Language } from '../types';

interface Props {
  onSelect: (lang: Language) => void;
}

export const LanguageSelector: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Choose Your Target Language
        </h1>
        <p className="text-lg text-gray-600">
          Pick a language and start practicing with LinguistBuddy AI.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang)}
            className="group relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-400 hover:shadow-md transition-all text-left"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              {lang.flag}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{lang.name}</h3>
            <p className="text-gray-500 font-medium">{lang.nativeName}</p>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-16 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
        <div className="p-3 bg-blue-500 rounded-full text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Adaptive Learning</h4>
          <p className="text-blue-700 text-sm">Our AI automatically detects your skill level and adjusts its complexity to keep you challenged but confident.</p>
        </div>
      </div>
    </div>
  );
};
