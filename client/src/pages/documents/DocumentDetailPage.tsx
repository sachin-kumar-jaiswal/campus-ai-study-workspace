import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, FileText, Sparkles, MessageSquare, Trash2,
  Send, Copy, RotateCcw, AlertCircle, CheckCircle2,
  RefreshCw, XCircle, ExternalLink, ChevronDown,
  ChevronUp, Bot, User as UserIcon, Eraser,
} from 'lucide-react';
import {
  getDocument, summarizeDocument, askDocument,
  getConversation, clearConversation, deleteDocument,
  getDocumentFileUrl, getErrorMessage,
} from '@/services/documentService';
import { Document, ChatMessage } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/EmptyState';
import { cn, formatDate } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (b: number) =>
  b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const STATUS_COLORS = {
  uploading: 'text-muted-foreground',
  processing: 'text-warning',
  ready: 'text-success',
  failed: 'text-destructive',
};
const STATUS_LABELS = {
  uploading: 'Uploading…',
  processing: 'Processing…',
  ready: 'Ready',
  failed: 'Failed',
};

// ─── Markdown renderer ────────────────────────────────────────────────────────
// react-markdown renders from a string — no dangerouslySetInnerHTML needed.

const MarkdownContent: React.FC<{ content: string; className?: string }> = ({
  content,
  className,
}) => (
  <div className={cn(
    'prose prose-sm dark:prose-invert max-w-none',
    'prose-headings:font-semibold prose-headings:text-foreground',
    'prose-p:text-foreground prose-p:leading-relaxed',
    'prose-li:text-foreground prose-strong:text-foreground',
    'prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded',
    className
  )}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

// ─── Chat message bubble ──────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: ChatMessage;
  onCopy: (text: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, onCopy }) => {
  const isUser = msg.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser ? 'bg-primary/10' : 'bg-muted'
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <UserIcon className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[82%] group', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="leading-relaxed">{msg.content}</p>
          ) : (
            <MarkdownContent content={msg.content} />
          )}
        </div>

        {/* Copy button — visible on hover */}
        {!isUser && (
          <button
            onClick={() => onCopy(msg.content)}
            className="mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            aria-label="Copy response"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Text viewer ──────────────────────────────────────────────────────────────

const TextViewer: React.FC<{ text: string; searchTerm: string }> = ({ text, searchTerm }) => {
  const MAX_INITIAL = 8000;
  const [expanded, setExpanded] = useState(false);

  const displayText =
    !expanded && text.length > MAX_INITIAL ? text.slice(0, MAX_INITIAL) : text;

  // Highlight search term
  const renderText = () => {
    if (!searchTerm.trim()) {
      return <span className="whitespace-pre-wrap">{displayText}</span>;
    }
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = displayText.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i} className="whitespace-pre-wrap">{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="space-y-3">
      <div
        className="text-sm text-foreground leading-relaxed font-mono text-[0.8rem] bg-muted/30 rounded-xl p-4 max-h-96 overflow-y-auto border border-border"
        role="region"
        aria-label="Extracted document text"
      >
        {renderText()}
      </div>
      {text.length > MAX_INITIAL && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Show less</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> Show full text ({text.length.toLocaleString()} chars)</>
          )}
        </button>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'text' | 'summary' | 'chat';

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);

  // Document
  const [doc, setDoc] = useState<Document | null>(null);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('text');
  const [textSearch, setTextSearch] = useState('');

  // Summary
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatError, setChatError] = useState('');
  const [clearingChat, setClearingChat] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);

  // ── Load document + conversation ─────────────────────────────────────────

  const loadDocument = useCallback(async () => {
    if (!id) return;
    setDocLoading(true);
    setDocError('');
    try {
      const [fetchedDoc, conv] = await Promise.all([
        getDocument(id),
        getConversation(id).catch(() => ({ messages: [] as ChatMessage[] })),
      ]);
      setDoc(fetchedDoc);
      setMessages(conv.messages ?? []);
      // Pre-populate summary if already cached
      if (fetchedDoc.summary) setSummary(fetchedDoc.summary);
    } catch (err) {
      setDocError(getErrorMessage(err));
    } finally {
      setDocLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDocument(); }, [loadDocument]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, asking]);

  // ── Summary ──────────────────────────────────────────────────────────────

  const handleSummarize = async (regenerate = false) => {
    if (!id || !doc) return;
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const text = await summarizeDocument(id, regenerate);
      setSummary(text);
      setDoc((d) => d ? { ...d, summary: text } : d);
      if (activeTab !== 'summary') setActiveTab('summary');
    } catch (err) {
      setSummaryError(getErrorMessage(err));
      showToast('error', 'Summary failed', getErrorMessage(err));
    } finally {
      setSummaryLoading(false);
    }
  };

  // ── Ask AI ───────────────────────────────────────────────────────────────

  const handleAsk = async () => {
    if (!id || !question.trim() || asking) return;
    const q = question.trim();
    setQuestion('');
    setChatError('');
    setAsking(true);

    // Optimistic user message
    const userMsg: ChatMessage = { role: 'user', content: q, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const { answer } = await askDocument(id, q);
      const aiMsg: ChatMessage = { role: 'assistant', content: answer, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const msg = getErrorMessage(err);
      setChatError(msg);
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m !== userMsg));
      setQuestion(q); // restore question
    } finally {
      setAsking(false);
      questionRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // ── Clear chat ───────────────────────────────────────────────────────────

  const handleClearChat = async () => {
    if (!id || !window.confirm('Clear all conversation messages?')) return;
    setClearingChat(true);
    try {
      await clearConversation(id);
      setMessages([]);
      showToast('success', 'Chat cleared', 'All messages have been removed.');
    } catch (err) {
      showToast('error', 'Failed to clear chat', getErrorMessage(err));
    } finally {
      setClearingChat(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!id || !doc) return;
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteDocument(id);
      showToast('success', 'Document deleted');
      navigate('/dashboard/documents');
    } catch (err) {
      showToast('error', 'Delete failed', getErrorMessage(err));
      setDeleting(false);
    }
  };

  // ── Copy ─────────────────────────────────────────────────────────────────

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', 'Copied to clipboard');
    } catch {
      showToast('error', 'Copy failed');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (docLoading) return <DetailSkeleton />;
  if (docError) return <ErrorState message={docError} onRetry={loadDocument} />;
  if (!doc) return null;

  const isReady = doc.status === 'ready';
  const hasText = Boolean(doc.extractedText?.trim());

  const tabs: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'text', label: 'Document Text', icon: FileText },
    { id: 'summary', label: 'AI Summary', icon: Sparkles },
    { id: 'chat', label: `Chat (${messages.length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/dashboard/documents')}
          className="-ml-2 w-fit"
        >
          My Documents
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{doc.title}</h1>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{doc.originalFileName}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                <span>{formatBytes(doc.fileSize)}</span>
                {doc.pageCount > 0 && <span>{doc.pageCount} pages</span>}
                <span>Uploaded {formatDate(doc.createdAt)}</span>
                <span className={cn('font-medium', STATUS_COLORS[doc.status])}>
                  {STATUS_LABELS[doc.status]}
                </span>
              </div>
              {doc.errorMessage && (
                <div className="flex items-start gap-1.5 mt-2">
                  <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-warning leading-relaxed">{doc.errorMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isReady && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                onClick={async () => {
                  // Fetch with auth header, create a blob URL for the browser to open
                  try {
                    const token = localStorage.getItem('campus_ai_token');
                    const res = await fetch(getDocumentFileUrl(doc._id), {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (!res.ok) throw new Error('Failed to fetch PDF');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    // Revoke after a short delay to allow the tab to load
                    setTimeout(() => URL.revokeObjectURL(url), 30000);
                  } catch {
                    showToast('error', 'Could not open PDF', 'Please try again.');
                  }
                }}
              >
                View PDF
              </Button>
            )}
            {isReady && hasText && (
              <Button
                size="sm"
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                isLoading={summaryLoading}
                onClick={() => handleSummarize(false)}
                disabled={summaryLoading}
              >
                {summary ? 'View Summary' : 'Summarize'}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={handleDelete}
              isLoading={deleting}
              className="text-destructive hover:bg-destructive/5"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Not ready state */}
      {!isReady && (
        <Card>
          <CardContent className="flex items-center gap-4 py-8 justify-center">
            {doc.status === 'processing' || doc.status === 'uploading' ? (
              <>
                <RefreshCw className="h-5 w-5 text-warning animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Document is being processed. Please wait or refresh.
                </p>
                <Button size="sm" variant="outline" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={loadDocument}>
                  Refresh
                </Button>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-muted-foreground">Processing failed. {doc.errorMessage}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      {isReady && (
        <div>
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border mb-5" role="tablist">
            {tabs.map(({ id: tid, label, icon: Icon }) => (
              <button
                key={tid}
                role="tab"
                aria-selected={activeTab === tid}
                aria-controls={`panel-${tid}`}
                id={`tab-${tid}`}
                onClick={() => setActiveTab(tid)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                  activeTab === tid
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Text tab ─────────────────────────────────────────────────── */}
          {activeTab === 'text' && (
            <div role="tabpanel" id="panel-text" aria-labelledby="tab-text" className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {hasText
                    ? `${doc.extractedText!.length.toLocaleString()} characters extracted`
                    : 'No extractable text found'}
                </p>
                {hasText && (
                  <input
                    type="search"
                    value={textSearch}
                    onChange={(e) => setTextSearch(e.target.value)}
                    placeholder="Search in text…"
                    className="h-7 px-2.5 text-xs rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-40"
                    aria-label="Search within document text"
                  />
                )}
              </div>

              {hasText ? (
                <TextViewer text={doc.extractedText!} searchTerm={textSearch} />
              ) : (
                <Card>
                  <CardContent className="py-10 text-center">
                    <AlertCircle className="h-8 w-8 text-warning mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">No text available</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {doc.errorMessage || 'This PDF does not contain selectable text. It may be a scanned image.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Summary tab ──────────────────────────────────────────────── */}
          {activeTab === 'summary' && (
            <div role="tabpanel" id="panel-summary" aria-labelledby="tab-summary" className="space-y-4 animate-fade-in">
              {summaryError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{summaryError}</span>
                </div>
              )}

              {!summary && !summaryLoading && !summaryError && (
                <Card>
                  <CardContent className="py-12 text-center space-y-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Sparkles className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Generate AI Summary</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        AI will analyse the document and produce a structured academic summary with key concepts, important points, and exam-relevant topics.
                      </p>
                    </div>
                    <Button
                      leftIcon={<Sparkles className="h-4 w-4" />}
                      onClick={() => handleSummarize(false)}
                      isLoading={summaryLoading}
                    >
                      Generate Summary
                    </Button>
                  </CardContent>
                </Card>
              )}

              {summaryLoading && (
                <Card>
                  <CardContent className="py-10 flex flex-col items-center gap-3">
                    <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">AI is reading your document…</p>
                  </CardContent>
                </Card>
              )}

              {summary && !summaryLoading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-xs text-muted-foreground">Summary generated by AI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Copy className="h-3.5 w-3.5" />}
                        onClick={() => handleCopy(summary)}
                      >
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                        onClick={() => handleSummarize(true)}
                        isLoading={summaryLoading}
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                  <Card>
                    <CardContent className="p-5">
                      <MarkdownContent content={summary} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ── Chat tab ─────────────────────────────────────────────────── */}
          {activeTab === 'chat' && (
            <div role="tabpanel" id="panel-chat" aria-labelledby="tab-chat" className="space-y-4 animate-fade-in">
              <Card className="flex flex-col" style={{ minHeight: '480px' }}>
                {/* Chat header */}
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
                      Ask about this document
                    </CardTitle>
                    {messages.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Eraser className="h-3.5 w-3.5" />}
                        onClick={handleClearChat}
                        isLoading={clearingChat}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '380px' }}>
                  {messages.length === 0 && !asking && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Ask anything about this document</p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        AI will answer based only on the document's content — no guessing or hallucinating.
                      </p>
                      {/* Suggested questions */}
                      <div className="flex flex-wrap gap-2 justify-center mt-1">
                        {[
                          'Summarise the main topic',
                          'List the key concepts',
                          'What are the important formulas?',
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => { setQuestion(q); questionRef.current?.focus(); }}
                            className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} onCopy={handleCopy} />
                  ))}

                  {/* Typing indicator */}
                  {asking && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {chatError && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{chatError}</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </CardContent>

                {/* Input */}
                <div className="border-t border-border p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={questionRef}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
                      rows={2}
                      disabled={asking || !hasText}
                      aria-label="Ask a question about this document"
                      className={cn(
                        'flex-1 resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'transition-colors'
                      )}
                    />
                    <Button
                      size="icon"
                      onClick={handleAsk}
                      disabled={!question.trim() || asking || !hasText}
                      isLoading={asking}
                      aria-label="Send question"
                      className="h-10 w-10 shrink-0 rounded-xl"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {!hasText && (
                    <p className="text-xs text-warning mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      No extractable text — Q&A is unavailable for this document.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const DetailSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-start gap-4">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

export default DocumentDetailPage;
