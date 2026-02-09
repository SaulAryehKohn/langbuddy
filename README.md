# Jerome: Your Adaptive Language Learning Partner

Jerome is an interactive language learning web application that transforms traditional, static study into a dynamic, conversational experience. By leveraging the full suite of **Gemini 3** capabilities, Jerome acts not just as a chatbot, but as a personalized tutor that listens, speaks, and evolves alongside the learner.

## Gemini 3: The Core of the Experience

Jerome is built entirely around the multimodal and reasoning capabilities of the Gemini 3 series. The application utilizes the **Multimodal Live API** (`gemini-2.5-flash-native-audio-preview-12-2025`) to provide low-latency, real-time voice interactions, allowing users to practice speaking naturally without the "turn-taking" lag typical of older LLMs. 

Central to the learning loop is **Structured JSON Output**, powered by `gemini-3-flash-preview`. After every session, the model performs deep reasoning to extract vocabulary, detect "mastered" words used naturally by the student, and generate localized summaries. Furthermore, the **Gemini TTS** (`gemini-2.5-flash-preview-tts`) engine provides high-fidelity, cheerful audio feedback in the Chat mode. For the "Bridge" feature—which helps users translate a complex thought into the target language—Gemini's rapid translation and usage-tip generation provide a seamless "conversational crutch" that maintains the flow of the session. These features are not merely additions; they are the architectural foundation that enables a truly adaptive, hands-free pedagogical tool.

---

## Technical Execution | 40%

The project demonstrates a high-quality, full-stack frontend architecture using **React 19**, **TypeScript**, and **Tailwind CSS**. 

- **State-of-the-Art Gemini Integration**: The application utilizes the latest `@google/genai` SDK, implementing advanced patterns like **MediaStream processing for Live Audio**, **Base64 PCM decoding**, and **Google Search Grounding**.
- **Performance & Quality**: Jerome features a responsive, accessible UI with smooth "glassmorphism" aesthetics. The code is modular, separating concerns into a robust `dbService` for SRS logic, `pdfService` for document generation, and `audioUtils` for raw byte handling.
- **SRS Implementation**: A custom implementation of the SM-2 algorithm ensures that vocabulary isn't just learned once but retained long-term, with Gemini automatically detecting "success" during natural speech.

## Potential Impact | 20%

Jerome addresses the "Intermediate Plateau" where learners struggle to transition from flashcards to real-world conversation. 
- **Broad Market Reach**: From tourists needing survival phrases to advanced students honing their fluency, the adaptive difficulty system makes the app useful for all levels.
- **Efficiency**: By generating instant session reports and PDFs, Jerome saves learners hours of manual note-taking, allowing them to focus entirely on the act of communication.

## Innovation / Wow Factor | 30%

- **The "Bridge" Feature**: A novel solution to the "blank page" problem in speaking. Users can type a thought in English, and Gemini instantly provides the target language equivalent with a usage tip, which can then be used in the voice session.
- **Auto-Mastery Detection**: Unlike traditional apps that rely on buttons like "I knew this," Jerome *proves* you know a word by detecting its correct usage within the flow of a natural conversation using LLM reasoning.
- **Under-Resourced Language Support**: A significant innovation is Jerome’s inclusion of languages like **Gàidhlig (Scots Gaelic)**, **Cymraeg (Welsh)**, and **Te Reo Māori**. Gemini is uniquely positioned here; its vast training data includes nuanced understanding of these languages where traditional NLP tools often fail. This makes Jerome a vital tool for language revitalization efforts globally.

## Presentation / Demo | 10%

The solution is presented through a highly polished, mobile-responsive interface.
- **Documentation**: Comprehensive logic is provided in the codebase, with clear interfaces for all multimodal interactions.
- **Architecture**: The app follows a clear flow: 
    1. **Auth/Dashboard**: Personalization.
    2. **Active Studio**: Multimodal Live API (Audio-in/Audio-out).
    3. **Insights Engine**: Structured data extraction.
    4. **Persistence**: Local Storage + SRS + PDF Export.

---
*Jerome — Built for the future of language, powered by Google Gemini 3.*