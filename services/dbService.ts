
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

  saveVocab: (newItems: VocabItem[]) => {
    const data = localStorage.getItem(STORAGE_KEYS.VOCAB);
    let bank: VocabItem[] = data ? JSON.parse(data) : [];
    
    // Merge new items, avoiding duplicates
    newItems.forEach(item => {
      if (!bank.find(i => i.word.toLowerCase() === item.word.toLowerCase() && i.languageCode === item.languageCode)) {
        bank.push(item);
      }
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
    const data = localStorage.getItem(STORAGE_KEYS.VOCAB);
    let bank: VocabItem[] = data ? JSON.parse(data) : [];
    const lowerWords = words.map(w => w.toLowerCase());
    
    bank = bank.map(i => 
      (i.languageCode === langCode && lowerWords.includes(i.word.toLowerCase())) 
        ? { ...i, mastered } 
        : i
    );
    localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(bank));
  }
};
