# Jerome - Architecture Diagram

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│                                                                      │
│  ┌────────────┐   ┌──────────────────────────────────────────────┐   │
│  │ index.html │──▶│              React SPA                       │   │
│  │ index.tsx  │   │                                              │   │
│  └────────────┘   │  ┌────────────────────────────────────────┐  │   │
│                    │  │           App.tsx (State Machine)      │  │   │
│                    │  │         AppState enum router           │  │   │
│                    │  └──────────────┬─────────────────────────┘  │   │
│                    │                 │                             │   │
│                    │     ┌───────────┼───────────┐                │   │
│                    │     ▼           ▼           ▼                │   │
│                    │  Components  Services   Types/Models         │   │
│                    └──────────────────────────────────────────────┘   │
│                                      │                               │
└──────────────────────────────────────┼───────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
           ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
           │ Google Gemini│   │ localStorage │   │     CDN      │
           │   3 API      │   │  (3 keys)    │   │              │
           │              │   │              │   │ Tailwind CSS │
           │ - Chat       │   │ lb_user      │   │ jsPDF        │
           │ - Voice/Live │   │ lb_history   │   │ Google Fonts │
           │ - TTS        │   │ lb_vocab     │   │              │
           └──────────────┘   └──────────────┘   └──────────────┘
```

---

## Application State Machine

`App.tsx` uses an `AppState` enum to drive navigation. No router library is used.

```
                          ┌──────────┐
                          │   AUTH   │
                          └────┬─────┘
                               │ onAuth()
                               ▼
                    ┌──────────────────────┐
           ┌───────│      DASHBOARD       │◀──────────────────┐
           │       └──────────┬───────────┘                   │
           │                  │ onStartSession()              │
           │                  ▼                               │
           │          ┌──────────────┐                        │
           │          │    SETUP     │                        │
           │          │ (Lang Select)│                        │
           │          └──────┬───────┘                        │
           │                 │ onSelect()                     │
           │          ┌──────┴───────┐                        │
           │          ▼              ▼                        │
           │   ┌────────────┐ ┌─────────────┐                │
           │   │ LIVE_VOICE │ │    CHAT     │                │
           │   │            │◀▶│            │ (switch mode)  │
           │   └─────┬──────┘ └──────┬──────┘                │
           │         │               │                        │
           │         └───────┬───────┘                        │
           │                 │ onEnd()                        │
           │                 ▼                                │
           │         ┌──────────────┐                        │
           │         │   SUMMARY    │────────────────────────┘
           │         └──────────────┘  onComplete() / onRestart()
           │
           │   ┌──────────────┐
           ├──▶│   SETTINGS   │──▶ (back to DASHBOARD)
           │   └──────────────┘
           │
           │   ┌──────────────┐
           └──▶│  VOCAB_BANK  │──▶ (back to DASHBOARD)
               └──────────────┘
```

---

## Component Dependency Graph

```
                              App.tsx
                    ┌───────────┼───────────────────────────────┐
                    │           │                               │
                    ▼           ▼                               ▼
              AuthForm.tsx    Dashboard.tsx             LanguageSelector.tsx
                              │
        ┌─────────────────────┼──────────────────────────┐
        │                     │                          │
        ▼                     ▼                          ▼
   ChatInterface.tsx    VoiceInterface.tsx          SummaryView.tsx
   │                    │                          │
   ├─ gemini.ts         ├─ gemini.ts               ├─ gemini.ts
   │  (chat, TTS,       │  (bridge)                │  (extractSessionInsights)
   │   greeting,         │                          │
   │   bridge)           ├─ audioUtils.ts           ├─ dbService.ts
   │                     │  (encode, decode,        │  (saveSession, saveVocab,
   └─ audioUtils.ts      │   createBlob,            │   updateSRS, setMasteryBulk)
      (decode,           │   decodeAudioData)       │
       decodeAudioData)  │                          └─ pdfService.ts
                         └─ @google/genai              (generateSessionPDF)
                            (Live API direct)

        Settings.tsx                VocabBank.tsx
        (no service deps)          │
                                   └─ dbService.ts
                                      (toggleVocabMastery)
```

---

## Service Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        services/                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ gemini.ts                          Google Gemini 3 API      │ │
│  │                                                             │ │
│  │  getGeminiChatResponse()  ──▶ gemini-3-flash-preview        │ │
│  │  generateInitialGreeting() ──▶ gemini-3-flash-preview       │ │
│  │  getBridgeTranslation()   ──▶ gemini-3-flash-preview        │ │
│  │  extractSessionInsights() ──▶ gemini-3-flash-preview        │ │
│  │  generateTTS()            ──▶ gemini-2.5-flash-preview-tts  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ dbService.ts                        localStorage wrapper    │ │
│  │                                                             │ │
│  │  getUser() / saveUser()         ──▶ lb_user                 │ │
│  │  getHistory() / saveSession()   ──▶ lb_history              │ │
│  │  getVocab() / saveVocab()       ──▶ lb_vocab                │ │
│  │  getDueVocab()                  ──▶ lb_vocab (filtered)     │ │
│  │  updateSRS() / toggleVocabMastery() / setVocabMasteryBulk() │ │
│  │                                                             │ │
│  │  SM-2 Spaced Repetition Algorithm:                          │ │
│  │    success → interval *= easeFactor, easeFactor += 0.1      │ │
│  │    failure → interval = 1, easeFactor -= 0.2                │ │
│  │    mastered when interval > 30 days                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────┐  ┌──────────────────────────────┐ │
│  │ audioUtils.ts             │  │ pdfService.ts                │ │
│  │                           │  │                              │ │
│  │  encode()   base64 encode │  │  generateSessionPDF()        │ │
│  │  decode()   base64 decode │  │    → header + metadata       │ │
│  │  decodeAudioData() PCM→AB │  │    → summary section         │ │
│  │  createBlob() F32→PCM     │  │    → vocabulary cards        │ │
│  └───────────────────────────┘  │    → multi-page pagination   │ │
│                                 └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models (types.ts)

```
┌──────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│   UserProfile    │     │    SessionHistory     │     │     VocabItem     │
├──────────────────┤     ├──────────────────────┤     ├───────────────────┤
│ id               │     │ id                   │     │ word              │
│ displayName      │     │ userId               │     │ translation       │
│ email            │     │ languageCode         │     │ pronunciation     │
│ targetLanguages[]│     │ timestamp            │     │ example           │
│ defaultDifficulty│     │ duration (minutes)   │     │ languageCode      │
│ assistantName    │     │ difficulty           │     │ dateAdded         │
│ assistantPerson- │     │ summary              │     │ mastered?         │
│   ality          │     │ translatedSummary?   │     │─── SRS Fields ───│
│ joinedDate       │     │ messages: Message[]  │     │ lastReviewDate?   │
└──────────────────┘     │ vocabCount           │     │ nextReviewDate?   │
                         └──────────────────────┘     │ interval?         │
┌──────────────────┐     ┌──────────────────────┐     │ easeFactor?       │
│     Message      │     │      Language        │     │ repetitionCount?  │
├──────────────────┤     ├──────────────────────┤     └───────────────────┘
│ role (user/asst) │     │ code                 │
│ content          │     │ name                 │     ┌───────────────────┐
│ timestamp        │     │ nativeName           │     │   SessionData     │
└──────────────────┘     │ flag (emoji)         │     ├───────────────────┤
                         └──────────────────────┘     │ language          │
                                                      │ messages[]        │
Enums:                                                │ vocabulary[]      │
  AppState: AUTH | DASHBOARD | SETTINGS |             │ summary           │
            VOCAB_BANK | HISTORY | SETUP |            │ translatedSummary?│
            CHAT | LIVE_VOICE | SUMMARY               └───────────────────┘

  Difficulty: Beginner | Intermediate | Advanced | Auto-adapt
  Personality: Encouraging | Direct | Playful | Academic
```

---

## Data Flow: Learning Session

```
 User                   React Components              Services               External
  │                          │                            │                      │
  │  Start session           │                            │                      │
  ├─────────────────────────▶│ Dashboard                  │                      │
  │                          │──▶ LanguageSelector        │                      │
  │  Select language         │                            │                      │
  ├─────────────────────────▶│                            │                      │
  │                          │                            │                      │
  │          ┌───────────────┴───────────────┐            │                      │
  │          ▼                               ▼            │                      │
  │   VoiceInterface                   ChatInterface      │                      │
  │          │                               │            │                      │
  │          │ Microphone audio              │ Text input │                      │
  │          │──────────────────────────────────────────▶│ Gemini Live API      │
  │          │                               │──────────▶│ getGeminiChatResponse│
  │          │                               │           │──────────────────────▶│
  │          │◀──────────────────────────────────────────│◀─────────────────────│
  │          │ Audio response                │◀──────────│ Text + TTS response  │
  │          │                               │           │                      │
  │  Bridge  │                               │           │                      │
  │  request │──────────────────────────────────────────▶│ getBridgeTranslation │
  │          │◀──────────────────────────────────────────│ { translation, tip } │
  │          │                               │           │                      │
  │  End     │                               │           │                      │
  ├─────────▶│ onEnd(messages)               │           │                      │
  │          └───────────────┬───────────────┘           │                      │
  │                          ▼                            │                      │
  │                    SummaryView                        │                      │
  │                          │───────────────────────────▶│ extractSessionInsights
  │                          │◀──────────────────────────│ { summary, vocab,    │
  │                          │                            │   masteredWords }    │
  │                          │───────────────────────────▶│                      │
  │                          │  db.saveSession()          │                      │
  │                          │  db.saveVocab()            │                      │
  │                          │  db.updateSRS()            │                      │
  │                          │  db.setVocabMasteryBulk()  │                      │
  │                          │                            │                      │
  │                          │  generateSessionPDF()      │                      │
  │  Download PDF            │◀──────────────────────────│                      │
  │◀─────────────────────────│                            │                      │
  │                          │                            │                      │
  │                          ▼                            │                      │
  │                     Dashboard (refreshed)             │                      │
```

---

## File Inventory

```
jerome/
├── index.html                 Entry point (HTML shell, CDN imports, importmap)
├── index.tsx                  React root render
├── App.tsx                    State machine, component orchestration
├── types.ts                   All TypeScript types, enums, constants
├── vite.config.ts             Build config (port 3000, env vars, aliases)
├── tsconfig.json              TypeScript compiler settings
├── package.json               Dependencies (react, @google/genai, marked)
├── metadata.json              App name, description, permissions
├── .env.local                 GEMINI_API_KEY
│
├── components/
│   ├── AuthForm.tsx           Login with beta access code
│   ├── Dashboard.tsx          Stats, recent sessions, quick actions
│   ├── LanguageSelector.tsx   9-language grid picker
│   ├── ChatInterface.tsx      Text chat with Gemini + TTS + Bridge
│   ├── VoiceInterface.tsx     Real-time voice via Gemini Live API
│   ├── SummaryView.tsx        Post-session insights + PDF export
│   ├── VocabBank.tsx          Vocabulary list with SRS status
│   └── Settings.tsx           User profile + assistant customization
│
├── services/
│   ├── gemini.ts              Gemini API wrapper (chat, TTS, insights, bridge)
│   ├── dbService.ts           localStorage CRUD + SM-2 SRS algorithm
│   ├── audioUtils.ts          PCM/base64 audio encoding/decoding
│   └── pdfService.ts          Session PDF generation with jsPDF
│
└── public/
    └── logo.png               Application logo
```

---

## Supported Languages

| Flag | Language     | Code |
|------|-------------|------|
| FR   | French       | fr   |
| DE   | German       | de   |
| ES   | Spanish      | es   |
| IT   | Italian      | it   |
| JP   | Japanese     | ja   |
| PT   | Portuguese   | pt   |
| GD   | Scots Gaelic | gd   |
| CY   | Welsh        | cy   |
| MI   | Maori        | mi   |
