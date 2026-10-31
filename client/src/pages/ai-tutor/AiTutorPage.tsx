import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  Send,
  Trash2,
  FileText,
  ChevronDown,
  AlertCircle,
  Sparkles,
  X,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { AiChatMessage } from '@/types';
import {
  sendMessage,
  loadConversation,
  clearConversation,
  getErrorMessage,
} from '@/services/aiService';
import { getDocuments } from '@/services/documentService';
import type { Document } from '@/types';

// ─── Message bubble ──────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: AiChatMessage;
  userName: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, userName }) => {
  const isUser = message.role === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-1',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold select-none',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/10 text-primary border border-primary/20'
        )}
        aria-hidden="true"
      >
        {isUser ? userName.charAt(0).toUpperCase() : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[78%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-pre:my-2 prose-code:text-primary prose-pre:bg-muted/60 prose-pre:border prose-pre:border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {time && (
          <span className="text-[11px] text-muted-foreground px-1">{time}</span>
        )}
      </div>
    </div>
  );
};

// ─── Typing indicator ────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <div className="flex gap-3 px-4 py-1">
    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
      <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
    </div>
    <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
);

// ─── Document selector ───────────────────────────────────────────────────────

interface DocSelectorProps {
  documents: Document[];
  selected: Document | null;
  onSelect: (doc: Document | null) => void;
  disabled: boolean;
}

const DocSelector: React.FC<DocSelectorProps> = ({
  documents,
  selected,
  onSelect,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition-colors',
          'bg-card border-border text-foreground',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          selected && 'border-primary/40 bg-primary/5'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select document for context"
      >
        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]">
          {selected ? selected.title : 'General chat'}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onSelect(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onSelect(null); } }}
            className="ml-1 text-muted-foreground hover:text-foreground"
            aria-label="Remove document context"
          >
            <X className="h-3 w-3" />
          </span>
        )}
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Available documents"
          className="absolute bottom-full mb-2 left-0 w-72 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Chat context
            </p>
          </div>

          {/* General option */}
          <button
            role="option"
            aria-selected={!selected}
            type="button"
            onClick={() => { onSelect(null); setOpen(false); }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors hover:bg-muted',
              !selected && 'bg-primary/5 text-primary'
            )}
          >
            <Sparkles className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">General chat</p>
              <p className="text-xs text-muted-foreground">Ask anything academic</p>
            </div>
          </button>

          {documents.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {documents.map((doc) => (
                <button
                  key={doc._id}
                  role="option"
                  aria-selected={selected?._id === doc._id}
                  type="button"
                  onClick={() => { onSelect(doc); setOpen(false); }}
                  className={cn(
                    'w-full flex items-start gap-2 px-3 py-2.5 text-sm text-left transition-colors hover:bg-muted',
                    selected?._id === doc._id && 'bg-primary/5 text-primary'
                  )}
                >
                  <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.pageCount ? `${doc.pageCount} pages` : 'PDF'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ userName: string; onSuggestion: (s: string) => void }> = ({
  userName,
  onSuggestion,
}) => {
  const suggestions = [
    'Explain the concept of recursion with an example.',
    'What is the difference between TCP and UDP?',
    'Help me understand Big-O notation.',
    'Explain Ohm\'s Law in simple terms.',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-6">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Bot className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Hey {userName.split(' ')[0]}, I'm your AI Tutor
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Ask me anything academic — concepts, problems, derivations, code — or select a
          document to chat about your study material.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const AiTutorPage: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.name ?? 'Student';

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Sentinel starts as `null` (never equal to a real id or `undefined`) so the
  // very first mount is NOT treated as a no-op by the dedup guard below.
  const prevDocIdRef = useRef<string | null | undefined>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load ready documents for the selector
  useEffect(() => {
    getDocuments({ status: 'ready', limit: 50 })
      .then((r) => setDocuments(r.documents))
      .catch(() => {/* non-fatal */});
  }, []);

  // Load conversation history when selected document changes
  const loadHistory = useCallback(async (docId?: string) => {
    setIsHistoryLoading(true);
    setError(null);
    setHistoryError(null);
    try {
      const result = await loadConversation(docId);
      setMessages(
        result.messages.map((m) => ({
          ...m,
          timestamp: m.timestamp ?? new Date().toISOString(),
        }))
      );
    } catch (err) {
      // Loading always ends in finally; surface a readable error so the user
      // can retry instead of staring at a spinner or a silent empty state.
      setMessages([]);
      setHistoryError(getErrorMessage(err));
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const newDocId = selectedDoc?._id ?? undefined;
    if (newDocId === prevDocIdRef.current) return;
    prevDocIdRef.current = newDocId;
    loadHistory(newDocId);
  }, [selectedDoc, loadHistory]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError(null);

    // Optimistic user message (no timestamp — server persists the real one)
    const optimisticMsg: AiChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsLoading(true);

    try {
      const result = await sendMessage({
        message: trimmed,
        documentId: selectedDoc?._id,
      });

      const aiMsg: AiChatMessage = {
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(getErrorMessage(err));
      // Roll back the optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      // Re-focus input after response
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [input, isLoading, selectedDoc]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (isClearing || messages.length === 0) return;
    setIsClearing(true);
    try {
      await clearConversation(selectedDoc?._id);
      setMessages([]);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsClearing(false);
    }
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleDocSelect = (doc: Document | null) => {
    if (doc?._id === selectedDoc?._id) return;
    setSelectedDoc(doc);
    setError(null);
  };

  // Retry loading the conversation after a failed history fetch.
  const handleRetryLoad = () => {
    loadHistory(selectedDoc?._id ?? undefined);
  };

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-none">AI Tutor</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedDoc
                ? `Chatting about: ${selectedDoc.title}`
                : 'General academic assistant'}
            </p>
          </div>
          {selectedDoc && (
            <Badge variant="primary" className="hidden sm:inline-flex">
              Document mode
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              isLoading={isClearing}
              onClick={handleClear}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto py-4 space-y-1"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {isHistoryLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading conversation...</p>
            </div>
          </div>
        ) : historyError ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Couldn&apos;t load your conversation
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm break-words">
                {historyError}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryLoad}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Retry
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState userName={userName} onSuggestion={handleSuggestion} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={`${msg.role}-${i}`}
                message={msg}
                userName={userName}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 mx-4 mb-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-3">
        {/* Doc selector row */}
        <div className="flex items-center gap-2 mb-2">
          <DocSelector
            documents={documents}
            selected={selectedDoc}
            onSelect={handleDocSelect}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground hidden sm:block">
            {selectedDoc
              ? 'Answers grounded in your document'
              : 'Ask any academic question'}
          </p>
        </div>

        {/* Text input row */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedDoc
                  ? `Ask about "${selectedDoc.title}"…`
                  : 'Ask anything academic… (Enter to send, Shift+Enter for new line)'
              }
              rows={1}
              maxLength={4000}
              disabled={isLoading || isHistoryLoading}
              aria-label="Message input"
              className={cn(
                'w-full resize-none rounded-xl border border-input bg-card px-4 py-2.5 text-sm',
                'text-foreground placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors leading-relaxed'
              )}
              style={{ minHeight: '42px', maxHeight: '160px' }}
            />
            {input.length > 3600 && (
              <p className="absolute right-3 bottom-2 text-[10px] text-muted-foreground select-none">
                {4000 - input.length}
              </p>
            )}
          </div>

          <Button
            onClick={handleSend}
            disabled={!canSend}
            isLoading={isLoading}
            size="icon"
            aria-label="Send message"
            className="flex-shrink-0 h-[42px] w-[42px] rounded-xl"
          >
            {!isLoading && <Send className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
          AI can make mistakes. Verify important information from your textbooks.
        </p>
      </div>
    </div>
  );
};

export default AiTutorPage;
