
import React, { useState, useEffect } from 'react';
import { SessionData, VocabItem } from '../types';
import { generateSessionPDF } from '../services/pdfService';
import { extractSessionInsights } from '../services/gemini';

interface Props {
  session: SessionData;
  onRestart: () => void;
}

export const SummaryView: React.FC<Props> = ({ session, onRestart }) => {
  const [data, setData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const insights = await extractSessionInsights(session.language, session.messages);
        const completeData = { ...session, ...insights };
        setData(completeData);
        
        const blob = await generateSessionPDF(completeData);
        setPdfBlob(blob);
      } catch (error) {
        console.error("Summary Generation Error", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

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
      <div className="max-w-4xl mx-auto py-24 text-center">
        <div className="mb-8 relative inline-block">
          <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2(0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyzing your session...</h2>
        <p className="text-gray-500">Extracting vocabulary and generating your learning report.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Session Report</h1>
          <p className="text-gray-500">Great work practicing your {session.language.name}!</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onRestart}
            className="px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
          >
            Start New
          </button>
          <button 
            onClick={handleDownload}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Summary */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">💡</span>
            Conversation Summary
          </h3>
          <p className="text-gray-600 leading-relaxed text-lg">
            {data?.summary}
          </p>
        </section>

        {/* Vocabulary List */}
        <section>
          <h3 className="text-xl font-bold mb-6 text-gray-900">New Vocabulary & Concepts</h3>
          <div className="grid grid-cols-1 gap-4">
            {data?.vocabulary.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-2xl font-bold text-gray-900">{item.word}</h4>
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-mono">
                    {item.pronunciation}
                  </span>
                </div>
                <p className="text-blue-600 font-semibold mb-3">{item.translation}</p>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 italic text-sm">"{item.example}"</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
