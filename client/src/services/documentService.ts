import api, { getErrorMessage } from './api';
import {
  Document,
  DocumentListResult,
  DocumentStats,
  Conversation,
  ApiSuccess,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListParams {
  search?: string;
  status?: string;
  sort?: 'newest' | 'oldest' | 'name';
  page?: number;
  limit?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Upload a PDF file with progress tracking.
 * @param file     - File object from input/drop
 * @param onProgress - 0–100 progress callback
 */
export const uploadDocument = async (
  file: File,
  onProgress?: (pct: number) => void
): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<ApiSuccess<{ document: Document }>>(
    '/documents',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );

  return data.data.document;
};

/** List documents with optional search / filter / sort / pagination. */
export const getDocuments = async (params?: ListParams): Promise<DocumentListResult> => {
  const { data } = await api.get<ApiSuccess<DocumentListResult>>('/documents', { params });
  return data.data;
};

/** Get a single document (includes extractedText). */
export const getDocument = async (id: string): Promise<Document> => {
  const { data } = await api.get<ApiSuccess<{ document: Document }>>(`/documents/${id}`);
  return data.data.document;
};

/** Delete a document and all its data. */
export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}`);
};

/** Generate (or retrieve cached) AI summary. Pass regenerate=true to force. */
export const summarizeDocument = async (
  id: string,
  regenerate = false
): Promise<string> => {
  const { data } = await api.post<ApiSuccess<{ summary: string }>>(
    `/documents/${id}/summarize`,
    {},
    { params: regenerate ? { regenerate: 'true' } : undefined }
  );
  return data.data.summary;
};

/** Ask a question about a document. */
export const askDocument = async (
  id: string,
  question: string
): Promise<{ answer: string; conversationId: string }> => {
  const { data } = await api.post<ApiSuccess<{ answer: string; conversationId: string }>>(
    `/documents/${id}/ask`,
    { question }
  );
  return data.data;
};

/** Retrieve conversation history for a document. */
export const getConversation = async (id: string): Promise<Conversation> => {
  const { data } = await api.get<ApiSuccess<{ conversation: Conversation }>>(
    `/documents/${id}/conversation`
  );
  return data.data.conversation;
};

/** Clear all messages in a document's conversation. */
export const clearConversation = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}/conversation`);
};

/** Get dashboard stats. */
export const getDocumentStats = async (): Promise<DocumentStats> => {
  const { data } = await api.get<ApiSuccess<DocumentStats>>('/documents/stats');
  return data.data;
};

/** Returns the authenticated URL to stream/view the PDF. */
export const getDocumentFileUrl = (id: string): string => {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/documents/${id}/file`;
};

export { getErrorMessage };
