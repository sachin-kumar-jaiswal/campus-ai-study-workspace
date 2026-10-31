import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Search, FileText, Trash2, ExternalLink, Sparkles,
  SortAsc, Filter, RefreshCw, AlertCircle, CheckCircle2,
  Clock, XCircle, X, FolderOpen,
} from 'lucide-react';
import { Document, DocumentStatus } from '@/types';
import {
  getDocuments, uploadDocument, deleteDocument, getErrorMessage,
} from '@/services/documentService';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, formatDate } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; icon: React.FC<{ className?: string }>; badge: 'default' | 'primary' | 'success' | 'warning' | 'destructive' }> = {
  uploading: { label: 'Uploading…', icon: Clock, badge: 'default' },
  processing: { label: 'Processing…', icon: RefreshCw, badge: 'warning' },
  ready: { label: 'Ready', icon: CheckCircle2, badge: 'success' },
  failed: { label: 'Failed', icon: XCircle, badge: 'destructive' },
};

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFile: (file: File) => void;
  uploading: boolean;
  progress: number;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFile, uploading, progress }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload PDF — click or drag and drop"
      onClick={() => !uploading && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer select-none',
        dragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border hover:border-primary/50 hover:bg-muted/30',
        uploading && 'pointer-events-none opacity-80'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={handleChange}
        aria-hidden="true"
      />

      {uploading ? (
        <div className="space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          </div>
          <p className="text-sm font-medium text-foreground">Processing document…</p>
          <div className="w-full max-w-xs mx-auto">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={cn(
            'h-12 w-12 rounded-2xl flex items-center justify-center mx-auto transition-colors',
            dragging ? 'bg-primary/20' : 'bg-muted'
          )}>
            <Upload className={cn('h-6 w-6', dragging ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Drop your PDF here, or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF only · Max 20 MB</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Document Card ────────────────────────────────────────────────────────────

interface DocumentCardProps {
  doc: Document;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onOpen, onDelete, deleting }) => {
  const statusCfg = STATUS_CONFIG[doc.status];
  const StatusIcon = statusCfg.icon;

  return (
    <Card hover className="group">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* PDF icon */}
          <div className="h-11 w-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-destructive" aria-hidden="true" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
              {doc.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.originalFileName}</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <span className="text-xs text-muted-foreground">
                PDF · {formatBytes(doc.fileSize)}
              </span>
              {doc.pageCount > 0 && (
                <span className="text-xs text-muted-foreground">{doc.pageCount} pages</span>
              )}
              <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</span>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-1.5 mt-2">
              <StatusIcon
                className={cn(
                  'h-3.5 w-3.5',
                  doc.status === 'processing' && 'animate-spin',
                  doc.status === 'ready' && 'text-success',
                  doc.status === 'failed' && 'text-destructive',
                  doc.status === 'processing' && 'text-warning',
                )}
                aria-hidden="true"
              />
              <Badge variant={statusCfg.badge} className="text-2xs py-0 px-1.5">
                {statusCfg.label}
              </Badge>
            </div>

            {/* Error message */}
            {doc.status === 'failed' && doc.errorMessage && (
              <p className="text-xs text-destructive mt-1.5 leading-relaxed line-clamp-2">
                {doc.errorMessage}
              </p>
            )}

            {/* Warning (scanned PDF) */}
            {doc.status === 'ready' && doc.errorMessage && (
              <div className="flex items-start gap-1.5 mt-1.5">
                <AlertCircle className="h-3 w-3 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-warning leading-relaxed line-clamp-2">{doc.errorMessage}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => onOpen(doc._id)}
            disabled={doc.status !== 'ready'}
            className="flex-1"
          >
            Open
          </Button>

          {doc.status === 'ready' && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => onOpen(doc._id)}
              className="flex-1"
            >
              Summarize
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(doc._id)}
            isLoading={deleting}
            disabled={deleting}
            aria-label={`Delete ${doc.title}`}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Skeleton cards ───────────────────────────────────────────────────────────

const DocSkeleton: React.FC = () => (
  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
    <div className="flex items-start gap-4">
      <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton className="h-8 w-full rounded-lg" />
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterStatus = '' | 'processing' | 'ready' | 'failed';
type SortOption = 'newest' | 'oldest' | 'name';

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // List state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
  const [sort, setSort] = useState<SortOption>('newest');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDocuments({
        search: search || undefined,
        status: filterStatus || undefined,
        sort,
      });
      setDocuments(result.documents);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, sort]);

  useEffect(() => {
    const t = setTimeout(() => fetchDocuments(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchDocuments, search]);

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    // Frontend validation
    if (file.type !== 'application/pdf') {
      showToast('error', 'Invalid file type', 'Only PDF files are allowed.');
      return;
    }
    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast('error', 'File too large', 'Maximum allowed size is 20 MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const doc = await uploadDocument(file, setUploadProgress);
      showToast(
        doc.status === 'ready' ? 'success' : doc.status === 'failed' ? 'error' : 'info',
        doc.status === 'ready' ? 'Document ready!' : doc.status === 'failed' ? 'Processing failed' : 'Document uploaded',
        doc.status === 'ready'
          ? `"${doc.title}" is ready to use.`
          : doc.errorMessage || undefined
      );
      await fetchDocuments();
    } catch (err) {
      showToast('error', 'Upload failed', getErrorMessage(err));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const doc = documents.find((d) => d._id === id);
    if (!doc) return;
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      await deleteDocument(id);
      showToast('success', 'Document deleted', `"${doc.title}" has been removed.`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      showToast('error', 'Delete failed', getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const filterOptions: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: '' },
    { label: 'Ready', value: 'ready' },
    { label: 'Processing', value: 'processing' },
    { label: 'Failed', value: 'failed' },
  ];

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Name', value: 'name' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="My Documents"
        description="Upload PDF lecture notes, textbooks, and papers. Ask AI questions from your documents."
        actions={
          <Badge variant="primary">
            {total} {total === 1 ? 'document' : 'documents'}
          </Badge>
        }
      />

      {/* Upload zone */}
      <UploadZone onFile={handleFile} uploading={uploading} progress={uploadProgress} />

      {/* Filters + search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by title or filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightElement={
              search ? (
                <button onClick={() => setSearch('')} aria-label="Clear search">
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              ) : undefined
            }
            aria-label="Search documents"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1" role="group" aria-label="Filter by status">
          <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1.5 shrink-0" aria-hidden="true" />
          {filterOptions.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              aria-pressed={filterStatus === value}
              className={cn(
                'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                filterStatus === value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1" role="group" aria-label="Sort documents">
          <SortAsc className="h-3.5 w-3.5 text-muted-foreground ml-1.5 shrink-0" aria-hidden="true" />
          {sortOptions.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={cn(
                'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                sort === value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      {error ? (
        <ErrorState message={error} onRetry={fetchDocuments} />
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <DocSkeleton key={n} />)}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-6 w-6" />}
          title={search || filterStatus ? 'No documents match your search' : 'No documents yet'}
          description={
            search || filterStatus
              ? 'Try adjusting your search or filters.'
              : 'Upload your first PDF to get started with AI-powered document intelligence.'
          }
          action={
            search || filterStatus
              ? { label: 'Clear filters', onClick: () => { setSearch(''); setFilterStatus(''); } }
              : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc._id}
              doc={doc}
              onOpen={(id) => navigate(`/dashboard/documents/${id}`)}
              onDelete={handleDelete}
              deleting={deletingId === doc._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
