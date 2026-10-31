/**
 * Context Manager — handles splitting large document text into chunks
 * and selecting the most relevant chunks for a given question.
 *
 * Phase 2 uses a simple keyword-overlap approach.
 * Phase 7+ can replace this with vector embeddings without changing the interface.
 */

const CHUNK_SIZE = 1500;       // characters per chunk (roughly 300–400 tokens)
const MAX_CONTEXT_CHARS = 12000; // ~3 000 tokens — safe for gpt-3.5/gpt-4o-mini

/**
 * Splits text into overlapping chunks so context isn't cut mid-sentence.
 */
export const chunkText = (text: string, size = CHUNK_SIZE): string[] => {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - 200; // 200-char overlap to avoid cutting sentences
    if (start >= text.length) break;
  }
  return chunks;
};

/**
 * Scores a chunk by how many question keywords it contains (case-insensitive).
 */
const scoreChunk = (chunk: string, question: string): number => {
  const keywords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3); // ignore short stop words

  const lower = chunk.toLowerCase();
  return keywords.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
};

/**
 * Returns the most relevant portion of document text for a given question,
 * capped at MAX_CONTEXT_CHARS to stay within token limits.
 */
export const getRelevantContext = (fullText: string, question: string): string => {
  if (fullText.length <= MAX_CONTEXT_CHARS) return fullText;

  const chunks = chunkText(fullText);

  // Score and sort chunks by relevance to the question
  const scored = chunks
    .map((chunk, i) => ({ chunk, score: scoreChunk(chunk, question), i }))
    .sort((a, b) => b.score - a.score || a.i - b.i); // ties: prefer earlier chunks

  // Greedily pick top chunks until we hit the limit
  let result = '';
  for (const { chunk } of scored) {
    if (result.length + chunk.length > MAX_CONTEXT_CHARS) break;
    result += (result ? '\n\n' : '') + chunk;
  }
  return result || fullText.slice(0, MAX_CONTEXT_CHARS);
};

/**
 * Truncates text for summarisation — takes the first N chars plus the last N chars
 * so the model sees the document's introduction and conclusion.
 */
export const getTextForSummary = (fullText: string): string => {
  const MAX = 14000; // ~3 500 tokens for summary
  if (fullText.length <= MAX) return fullText;

  const half = Math.floor(MAX / 2);
  return (
    fullText.slice(0, half) +
    '\n\n[... middle section truncated for length ...]\n\n' +
    fullText.slice(-half)
  );
};
