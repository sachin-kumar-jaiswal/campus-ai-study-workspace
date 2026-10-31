import OpenAI, { APIError } from 'openai';
import { AppError } from '../../middleware/errorHandler';
import {
  SUMMARY_SYSTEM_PROMPT,
  QA_SYSTEM_PROMPT,
  TUTOR_SYSTEM_PROMPT,
  DOC_TUTOR_SYSTEM_PROMPT,
  buildSummaryUserPrompt,
  buildQAUserPrompt,
  buildTutorUserPrompt,
  buildDocTutorUserPrompt,
} from './prompts';
import { getRelevantContext, getTextForSummary } from './contextManager';
import { ChatMessage } from '../../types/index';

let _client: OpenAI | null = null;

const getApiKey = (): string | null => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || /^(?:sk-(?:placeholder|replace|your)|replace_with|your[_ -]?)/i.test(key)) {
    return null;
  }
  return key;
};

/**
 * Lazy-initialise the OpenAI client so the server still starts
 * even when OPENAI_API_KEY is not yet set (development without AI).
 */
const getClient = (): OpenAI => {
  if (_client) return _client;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AppError(
      'AI is not configured. Set a valid OPENAI_API_KEY in the server environment to enable AI features.',
      503
    );
  }

  _client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });
  return _client;
};

const getModel = (): string => process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Checks whether the AI service is properly configured.
 */
export const isAiConfigured = (): boolean => {
  return getApiKey() !== null;
};

/**
 * Normalises a thrown provider error into a user-facing AppError.
 *
 * OpenAI quota / rate-limit (429) and auth (401) failures are NOT generic
 * "AI failed" cases — they mean the account is out of credits or the key is
 * bad. Surface a clean, actionable message with a 503 so the frontend can
 * show the user exactly what to do, instead of a raw upstream error.
 */
const mapAiError = (err: unknown, label: string): AppError => {
  // Re-throw our own operational errors unchanged (empty-message guards, etc.)
  if (err instanceof AppError) return err;

  if (err instanceof APIError) {
    if (err.status === 429) {
      if (err.code === 'insufficient_quota') {
        return new AppError(
          'The AI provider account has no remaining credits or has reached its spending limit. Add credits or increase the limit in the provider billing settings, then try again.',
          503
        );
      }
      if (err.code === 'rate_limit_exceeded' || err.type === 'rate_limit_error') {
        return new AppError(
          'The AI provider is receiving requests too quickly. Wait a minute and try again, or check the provider rate limits.',
          503
        );
      }
      return new AppError(
        'The AI provider temporarily rejected the request. Wait a minute and try again; if this continues, check the provider usage and billing limits.',
        503
      );
    }
    if (err.status === 401) {
      return new AppError(
        'The configured AI provider API key is invalid or unauthorised. Check OPENAI_API_KEY in the server environment.',
        503
      );
    }
    console.error(`[AI] ${label} error:`, err.message);
    return new AppError(`AI request failed: ${err.message}`, 502);
  }

  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[AI] ${label} error:`, msg);
  return new AppError(`AI request failed: ${msg}`, 502);
};

/**
 * Generates a structured academic summary of a document.
 *
 * @param extractedText - Full text extracted from the PDF
 * @returns Markdown-formatted summary string
 */
export const summariseDocument = async (extractedText: string): Promise<string> => {
  if (!extractedText.trim()) {
    throw new AppError('Cannot summarise an empty document.', 400);
  }

  const client = getClient();
  const context = getTextForSummary(extractedText);

  try {
    const response = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: buildSummaryUserPrompt(context) },
      ],
      temperature: 0.3,   // lower = more factual, less creative
      max_tokens: 1500,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (!summary) throw new AppError('AI returned an empty summary.', 502);
    return summary;
  } catch (err) {
    throw mapAiError(err, 'summariseDocument');
  }
};

/**
 * Answers a student question grounded in the document's extracted text.
 *
 * @param extractedText - Full text extracted from the PDF
 * @param question      - Student's question
 * @returns Answer string
 */
export const answerQuestion = async (
  extractedText: string,
  question: string
): Promise<string> => {
  if (!extractedText.trim()) {
    throw new AppError('Cannot answer questions about an empty document.', 400);
  }
  if (!question.trim()) {
    throw new AppError('Question cannot be empty.', 400);
  }

  const client = getClient();
  const context = getRelevantContext(extractedText, question);

  try {
    const response = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: QA_SYSTEM_PROMPT },
        { role: 'user', content: buildQAUserPrompt(context, question) },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const answer = response.choices[0]?.message?.content?.trim();
    if (!answer) throw new AppError('AI returned an empty answer.', 502);
    return answer;
  } catch (err) {
    throw mapAiError(err, 'answerQuestion');
  }
};

/**
 * Handles a general academic AI tutor conversation (no document).
 * Accepts the last N messages as history for context.
 *
 * @param userMessage  - The student's latest message
 * @param history      - Recent prior messages (user/assistant turns)
 * @returns AI reply string
 */
export const tutorChat = async (
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> => {
  if (!userMessage.trim()) {
    throw new AppError('Message cannot be empty.', 400);
  }

  const client = getClient();

  // Build the message array: system + history + new user message
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: TUTOR_SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: buildTutorUserPrompt(userMessage) },
  ];

  try {
    const response = await client.chat.completions.create({
      model: getModel(),
      messages,
      temperature: 0.5,
      max_tokens: 1200,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    if (!reply) throw new AppError('AI returned an empty response.', 502);
    return reply;
  } catch (err) {
    throw mapAiError(err, 'tutorChat');
  }
};

/**
 * Handles a document-aware AI tutor conversation.
 * Grounds the answer in the extracted document text.
 *
 * @param extractedText - Full document text
 * @param userMessage   - The student's latest message
 * @param history       - Recent prior messages
 * @returns AI reply string
 */
export const tutorChatWithDocument = async (
  extractedText: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> => {
  if (!extractedText.trim()) {
    throw new AppError('Document has no extractable text.', 400);
  }
  if (!userMessage.trim()) {
    throw new AppError('Message cannot be empty.', 400);
  }

  const client = getClient();
  const context = getRelevantContext(extractedText, userMessage);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: DOC_TUTOR_SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: buildDocTutorUserPrompt(context, userMessage) },
  ];

  try {
    const response = await client.chat.completions.create({
      model: getModel(),
      messages,
      temperature: 0.3,
      max_tokens: 1200,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    if (!reply) throw new AppError('AI returned an empty response.', 502);
    return reply;
  } catch (err) {
    throw mapAiError(err, 'tutorChatWithDocument');
  }
};

export interface GeneratedQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const generateQuizQuestions = async (
  source: string,
  questionCount: number
): Promise<GeneratedQuizQuestion[]> => {
  if (!source.trim()) {
    throw new AppError('Add a topic or a document with readable text to generate a quiz.', 400);
  }

  const client = getClient();
  const boundedSource = source.slice(0, 12000);

  try {
    const response = await client.chat.completions.create({
      model: getModel(),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Create a fair university-level multiple-choice quiz. Return only JSON with a "questions" array. Each item must have "prompt" (string), "options" (exactly four distinct strings), "correctIndex" (zero-based integer), and "explanation" (brief string). Make one answer unambiguously correct. Do not invent claims beyond the supplied material.',
        },
        {
          role: 'user',
          content: `Create exactly ${questionCount} questions from this study material:\n\n${boundedSource}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2400,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new AppError('The quiz generator returned an empty response.', 502);

    let payload: unknown;
    try {
      payload = JSON.parse(content);
    } catch {
      throw new AppError('The quiz generator returned an invalid response. Please try again.', 502);
    }

    if (!payload || typeof payload !== 'object' || !('questions' in payload)) {
      throw new AppError('The quiz generator returned an invalid response. Please try again.', 502);
    }

    const questions = (payload as { questions: unknown }).questions;
    if (!Array.isArray(questions) || questions.length !== questionCount) {
      throw new AppError('The quiz generator returned an incomplete quiz. Please try again.', 502);
    }

    return questions.map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new AppError(`Question ${index + 1} was invalid. Please try again.`, 502);
      }

      const question = item as Record<string, unknown>;
      if (
        typeof question.prompt !== 'string' ||
        !question.prompt.trim() ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        !question.options.every((option) => typeof option === 'string' && option.trim()) ||
        new Set(question.options).size !== 4 ||
        !Number.isInteger(question.correctIndex) ||
        Number(question.correctIndex) < 0 ||
        Number(question.correctIndex) > 3 ||
        typeof question.explanation !== 'string' ||
        !question.explanation.trim()
      ) {
        throw new AppError(`Question ${index + 1} was incomplete. Please try again.`, 502);
      }

      return {
        prompt: question.prompt.trim(),
        options: (question.options as string[]).map((option) => option.trim()),
        correctIndex: Number(question.correctIndex),
        explanation: question.explanation.trim(),
      };
    });
  } catch (err) {
    throw mapAiError(err, 'generateQuizQuestions');
  }
};
