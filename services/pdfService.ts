
import { SessionData, VocabItem } from '../types';

/**
 * Generates a polished, modern PDF summary of the learning session.
 * Includes improved typography, whitespace, and optional translated summary.
 */
export const generateSessionPDF = async (session: SessionData, includeTranslation: boolean = false) => {
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // --- Branding & Header ---
  // Large background accent for header
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('Jerome', margin, 22);
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254); // Blue-200
  doc.text(`SESSION PROGRESS REPORT • ${session.language.name.toUpperCase()}`, margin, 30);
  
  // Date and Metadata
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(dateStr, pageWidth - margin, 22, { align: 'right' });
  
  // Simple stats pill in header
  doc.setFillColor(30, 64, 175); // Blue-800
  doc.roundedRect(pageWidth - margin - 45, 28, 45, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`${session.messages.length} interactions`, pageWidth - margin - 22.5, 33.5, { align: 'center' });

  // --- Summary Section ---
  let y = 65;

  // English Summary Title
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Conversation Overview', margin, y);
  y += 10;

  // English Content Card
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(241, 245, 249); // Slate-100
  
  const summaryText = session.summary || "Conversation practice session.";
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 10);
  const summaryHeight = (splitSummary.length * 6) + 15;
  
  doc.roundedRect(margin - 2, y - 6, contentWidth + 4, summaryHeight, 3, 3, 'F');
  
  doc.setTextColor(51, 65, 85); // Slate-700
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(splitSummary, margin + 4, y + 4, { lineHeightFactor: 1.5 });
  
  y += summaryHeight + 10;

  // --- Optional Translated Summary Section ---
  if (includeTranslation && session.translatedSummary) {
    // Title for translation
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${session.language.name} Translation`, margin, y);
    y += 8;

    // Translation Card
    const splitTrans = doc.splitTextToSize(session.translatedSummary, contentWidth - 10);
    const transHeight = (splitTrans.length * 6) + 15;
    
    doc.setFillColor(245, 247, 255); // Indigo-50
    doc.roundedRect(margin - 2, y - 5, contentWidth + 4, transHeight, 3, 3, 'F');
    
    doc.setTextColor(49, 46, 129); // Indigo-900
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'italic');
    doc.text(splitTrans, margin + 4, y + 5, { lineHeightFactor: 1.5 });
    
    y += transHeight + 15;
  } else {
    y += 5;
  }

  // --- Vocabulary Section ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Vocabulary Learned', margin, y);
  y += 10;

  session.vocabulary.forEach((item, index) => {
    // Height estimation for the vocab item card
    const exSplit = doc.splitTextToSize(`"${item.example}"`, contentWidth - 45);
    const cardHeight = 35 + (exSplit.length * 5);

    // Page overflow check
    if (y + cardHeight > pageHeight - 25) {
      doc.addPage();
      y = 25;
      
      // Re-add section title if starting a new page mid-list
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`... vocabulary continued`, margin, y - 10);
    }

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.1);
    doc.roundedRect(margin, y, contentWidth, cardHeight - 5, 2, 2, 'FD');

    // Left Accent Strip
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(margin, y, 3, cardHeight - 5, 'F');

    // Word & Transliteration
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(item.word, margin + 8, y + 10);
    
    // Fix: Measure the width of the word while the font is still set to 13pt bold
    const wordWidth = doc.getTextWidth(item.word);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    // Add spacing after the word for the pronunciation
    doc.text(`sounds like: ${item.pronunciation}`, margin + 8 + wordWidth + 4, y + 10);

    // Translation
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(item.translation, margin + 8, y + 18);

    // Context / Example Sentence
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Usage:', margin + 8, y + 26);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'italic');
    doc.text(exSplit, margin + 22, y + 26, { lineHeightFactor: 1.3 });

    y += cardHeight;
  });

  // --- Footer ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages} • Created with Jerome`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
};
