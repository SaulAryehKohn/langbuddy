
export type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type VocabItem = {
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  mastered?: boolean;
  languageCode: string;
  dateAdded: number;
  // SRS Fields
  lastReviewDate?: number;
  nextReviewDate?: number;
  interval?: number; // In days
  easeFactor?: number; // SM-2 Ease Factor
  repetitionCount?: number;
};

export type Personality = 'Encouraging' | 'Direct' | 'Playful' | 'Academic';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Auto-adapt';

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  targetLanguages: string[]; // codes
  defaultDifficulty: Difficulty;
  assistantName: string;
  assistantPersonality: Personality;
  joinedDate: number;
};

export type SessionHistory = {
  id: string;
  userId: string;
  languageCode: string;
  timestamp: number;
  duration: number; // minutes
  difficulty: Difficulty;
  summary: string;
  translatedSummary?: string;
  messages: Message[];
  vocabCount: number;
};

export type SessionData = {
  language: Language;
  messages: Message[];
  vocabulary: VocabItem[];
  summary: string;
  translatedSummary?: string;
};

export enum AppState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS',
  VOCAB_BANK = 'VOCAB_BANK',
  HISTORY = 'HISTORY',
  SETUP = 'SETUP',
  CHAT = 'CHAT',
  LIVE_VOICE = 'LIVE_VOICE',
  SUMMARY = 'SUMMARY'
}

export const LANGUAGES: Language[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'jp', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'gd', name: 'Scots Gaelic', nativeName: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
];
