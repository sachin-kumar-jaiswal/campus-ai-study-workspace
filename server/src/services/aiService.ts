/**
 * AI Service — Phase 3 placeholder.
 *
 * This module will house all OpenAI API interactions in Phase 3.
 * The architecture is intentionally kept here so Phase 3 only needs
 * to fill in the implementations without restructuring.
 *
 * IMPORTANT: The OPENAI_API_KEY must NEVER be sent to the frontend.
 * All AI requests must be proxied through this service.
 *
 * Future methods (Phase 3+):
 *   - chat(messages): AI Tutor conversation
 *   - summariseDocument(text): Document summarisation
 *   - generateQuiz(content, count): Quiz generation
 *   - generateFlashcards(content): Flashcard generation
 *   - generateStudyPlan(subjects, deadline): Study plan
 */

export const aiService = {
  // Placeholder — will be implemented in Phase 3
  isConfigured: (): boolean => {
    return Boolean(process.env.OPENAI_API_KEY);
  },
};

export default aiService;
