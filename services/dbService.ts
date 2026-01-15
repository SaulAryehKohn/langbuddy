
import { UserProfile, SessionHistory, VocabItem, Difficulty, Personality } from '../types';

const STORAGE_KEYS = {
  USER: 'lb_user',
  HISTORY: 'lb_history',
  VOCAB: 'lb_vocab'
};

export const db = {
  // User Profile
  getUser: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  
  saveUser: (user: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  // Session History
  getHistory: (userId: string): SessionHistory[] => {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const history: SessionHistory[] = data ? JSON.parse(data) : [];
    return history.filter(h => h.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  },

  saveSession: (session: SessionHistory) => {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const history = data ? JSON.parse(data) : [];
    history.push(session);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  // Vocabulary Bank
  getVocab: (userId: string): VocabItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VOCAB);
    return data ? JSON.parse(data) : [];
  },

  getDueVocab: (userId: string, langCode: string): VocabItem[] => {
    const vocab = db.getVocab(userId);
    const now = Date.now();
    return vocab.filter(v => 
      v.languageCode === langCode && 
      (!v.nextReviewDate || v.nextReviewDate <= now) &&
      !v.mastered // Option to exclude mastered from reviews if desired, or keep them
    );
  },

  saveVocab: (newItems: VocabItem[]) => {
    const data = localStorage.getItem(STORAGE_KEYS.VOCAB);
    let bank: VocabItem[] = data ? JSON.parse(data) : [];
    
    newItems.forEach(item => {
      if (!bank.find(i => i.word.toLowerCase() === item.word.toLowerCase() && i.languageCode === item.languageCode)) {
        // Initialize SRS fields
        bank.push({
          ...item,
          interval: 0,
          easeFactor: 2.5,
          repetitionCount: 0,
          nextReviewDate: Date.now() + (1000 * 60 * 60 * 24) // 1 day from now
        });
      }
    });
    
    localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(bank));
  },

  // Simple SM-2 Spaced Repetition logic
  updateSRS: (words: string[], langCode: string, success: boolean) => {
    const data = localStorage.getItem(STORAGE_KEYS.VOCAB);
    let bank: VocabItem[] = data ? JSON.parse(data) : [];
    const lowerWords = words.map(w => w.toLowerCase());
    const now = Date.now();

    bank = bank.map(item => {
      if (item.languageCode === langCode && lowerWords.includes(item.word.toLowerCase())) {
        let { interval = 0, easeFactor = 2.5, repetitionCount = 0 } = item;

        if (success) {
          if (repetitionCount === 0) interval = 1;
          else if (repetitionCount === 1) interval = 6;
          else interval = Math.round(interval * easeFactor);
          
          repetitionCount += 1;
          // Optionally cap ease factor
          easeFactor = Math.max(1.3, easeFactor + 0.1);
        } else {
          repetitionCount = 0;
          interval = 1;
          easeFactor = Math.max(1.3, easeFactor - 0.2);
        }

        return {
          ...item,
          interval,
          easeFactor,
          repetitionCount,
          lastReviewDate: now,
          nextReviewDate: now + (interval * 24 * 60 * 60 * 1000),
          mastered: interval > 30 // Mark as fully mastered if interval exceeds 1 month
        };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(bank));
  },

  toggleVocabMastery: (word: string, langCode: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.VOCAB);
    let bank: VocabItem[] = data ? JSON.parse(data) : [];
    bank = bank.map(i => 
      (i.word === word && i.languageCode === langCode) ? { ...i, mastered: !i.mastered } : i
    );
    localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(bank));
  },

  setVocabMasteryBulk: (words: string[], langCode: string, mastered: boolean) => {
    // Re-use updateSRS for automated mastery so SRS data is maintained
    db.updateSRS(words, langCode, mastered);
  }
};
