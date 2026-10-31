import api, { getErrorMessage } from './api';
import { ApiSuccess, AiConversationResult } from '@/types';

export interface ChatPayload {
  message: string;
  documentId?: string;
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
}

/**
 * Send a message to the AI tutor.
 * Optionally pass documentId to ground the answer in an uploaded document.
 */
export const sendMessage = async (payload: ChatPayload): Promise<ChatResponse> => {
  const { data } = await api.post<ApiSuccess<ChatResponse>>('/ai/chat', payload);
  return data.data;
};

/**
 * Load conversation history from the server.
 * Pass documentId to load a document-specific conversation.
 */
export const loadConversation = async (
  documentId?: string
): Promise<AiConversationResult> => {
  const params = documentId ? { documentId } : undefined;
  const { data } = await api.get<ApiSuccess<AiConversationResult>>(
    '/ai/conversation',
    { params }
  );
  return data.data;
};

/**
 * Clear conversation history.
 */
export const clearConversation = async (documentId?: string): Promise<void> => {
  const params = documentId ? { documentId } : undefined;
  await api.delete('/ai/conversation', { params });
};

export { getErrorMessage };
