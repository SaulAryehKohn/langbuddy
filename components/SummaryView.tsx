
import React, { useState, useEffect } from 'react';
import { SessionData, VocabItem, UserProfile } from '../types';
import { generateSessionPDF } from '../services/pdfService';
import { extractSessionInsights } from '../services/gemini';

interface Props {
  session: SessionData;
  userProfile: UserProfile;
  onRestart: () => void;
  onComplete?: (finalData: SessionData) => void;
}

export const SummaryView: React.FC<Props> = ({ session, userProfile, onRestart, onComplete }) => {
  const [data, setData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const insights = await extractSessionInsights(session.language, session.messages, userProfile);
        const completeData = { ...session, ...insights };
        setData(completeData);
        
        if (onComplete) {
          onComplete(completeData);
        }
        
        // Initial PDF generation
        const blob = await generateSessionPDF(completeData, false);
        setPdfBlob(blob);
      } catch (error) {
        console.error("Summary Generation Error", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  // Update PDF specifically when the translation toggle is flipped
  useEffect(() => {
    const updatePDF = async () => {
      if (data) {
        const blob = await generateSessionPDF(data, showTranslation);
        setPdfBlob(blob);
      }
    };
    updatePDF();
  }, [showTranslation, data]);

  const handleDownload = () => {
    if (pdfBlob) {
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LinguistBuddy-Summary-${session.language.name}-${new Date().toLocaleDateString()}.pdf`;
      a.click();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center px-6">
        <div className="mb-8 relative inline-block">
          <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-blue-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Analyzing your session...</h2>
        <p className="text-gray-500 font-medium">Extracting vocabulary and saving your progress.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 leading-tight">Session Report</h1>
          <p className="text-gray-500 font-medium">Excellent practice in {session.language.name} today!</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={onRestart}
            className="flex-1 md:flex-none px-6 py-3 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all text-sm"
          >
            Dashboard
          </button>
          <button 
            onClick={handleDownload}
            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            GET PDF
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {/* Summary (English) */}
        <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-20"></div>
          <h3 className="text-xl font-black mb-4 flex items-center gap-3 text-gray-900">
            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">💡</span>
            Conversation Summary
          </h3>
          <p className="text-gray-600 leading-relaxed text-lg font-medium">
            {data?.summary}
          </p>
        </section>

        {/* Target Language Translation Option */}
        {data?.translatedSummary && (
          <section className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-indigo-900 flex items-center gap-2">
                <span className="text-lg">{session.language.flag}</span>
                Summary in {session.language.name}
              </h3>
              <button 
                onClick={() => setShowTranslation(!showTranslation)}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                  showTranslation 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'
                }`}
              >
                {showTranslation ? 'Included in PDF' : 'Add to PDF'}
              </button>
            </div>
            {showTranslation && (
              <p className="text-indigo-800 leading-relaxed font-medium animate-in slide-in-from-top-2 duration-300">
                {data.translatedSummary}
              </p>
            )}
          </section>
        )}

        {/* Vocabulary List */}
        <section>
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-black text-gray-900">New Vocabulary Captured</h3>
             <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{data?.vocabulary.length} items</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {data?.vocabulary.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-2xl font-black text-gray-900">{item.word}</h4>
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-mono font-bold italic" title="Transliteration">
                      sounds like: {item.pronunciation}
                    </span>
                  </div>
                  <p className="text-blue-600 font-black mb-3">{item.translation}</p>
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                    <p className="text-gray-500 italic text-sm leading-relaxed">"{item.example}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
