
import React, { useState } from 'react';
import { VocabItem, LANGUAGES } from '../types';
import { db } from '../services/dbService';

interface Props {
  vocab: VocabItem[];
  onBack: () => void;
  onToggleMastery: (word: string, langCode: string) => void;
}

export const VocabBank: React.FC<Props> = ({ vocab, onBack, onToggleMastery }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredVocab = vocab.filter(item => {
    const matchesLang = filter === 'all' || item.languageCode === filter;
    const matchesSearch = item.word.toLowerCase().includes(search.toLowerCase()) || 
                          item.translation.toLowerCase().includes(search.toLowerCase());
    return matchesLang && matchesSearch;
  });

  const getReviewLabel = (nextDate?: number) => {
    if (!nextDate) return 'New';
    const diff = nextDate - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Review Due';
    return `Review in ${days}d`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 font-bold transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-black text-gray-900">Vocabulary Bank</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
           <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
           <input 
            type="text" 
            placeholder="Search words or meanings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
           />
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-gray-100 rounded-2xl px-4 py-3 font-bold text-gray-600 outline-none shadow-sm"
        >
          <option value="all">All Languages</option>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredVocab.length > 0 ? (
          filteredVocab.map((item, idx) => (
            <div key={idx} className={`bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between group transition-all ${item.mastered ? 'border-amber-100' : 'border-gray-100 hover:border-blue-200'}`}>
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs">{LANGUAGES.find(l => l.code === item.languageCode)?.flag}</span>
                    <h3 className="text-xl font-black text-gray-900">{item.word}</h3>
                    <span className="text-xs text-gray-400 italic">sounds like: {item.pronunciation}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.mastered ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500'}`}>
                      {getReviewLabel(item.nextReviewDate)}
                    </span>
                 </div>
                 <p className="text-blue-600 font-bold text-sm mb-2">{item.translation}</p>
                 <p className="text-gray-400 text-xs italic">"{item.example}"</p>
              </div>
              <button 
                onClick={() => onToggleMastery(item.word, item.languageCode)}
                className={`ml-4 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  item.mastered 
                  ? 'bg-amber-100 text-amber-600' 
                  : 'bg-gray-50 text-gray-300 hover:bg-amber-50 hover:text-amber-400'
                }`}
                title={item.mastered ? "Unmark Mastery" : "Mark as Mastered"}
              >
                <svg className="w-6 h-6" fill={item.mastered ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
             <p className="text-gray-400 font-medium">No words match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
