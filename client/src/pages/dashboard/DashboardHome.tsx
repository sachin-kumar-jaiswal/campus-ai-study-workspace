import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Upload, ListChecks, CalendarDays, ArrowRight,
  Clock, FileText, BookOpen, CheckCircle2, AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { getDocumentStats } from '@/services/documentService';
import { DocumentStats, Document } from '@/types';
import { formatDate, cn } from '@/lib/utils';

// ─── Quick Action ─────────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  description: string;
  to: string;
  color: string;
  iconColor: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, description, to, color, iconColor }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="group text-left w-full rounded-xl border border-border bg-card p-5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`${label}: ${description}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Open</span>
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </div>
    </button>
  );
};

// ─── Greeting ─────────────────────────────────────────────────────────────────

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatBytes = (b: number) =>
  b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

// ─── Recent document row ──────────────────────────────────────────────────────

const RecentDocRow: React.FC<{ doc: Document; onClick: () => void }> = ({ doc, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full text-left py-2.5 px-1 rounded-lg hover:bg-muted/50 transition-colors group"
  >
    <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
      <FileText className="h-4 w-4 text-destructive" aria-hidden="true" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{doc.title}</p>
      <p className="text-xs text-muted-foreground">{formatBytes(doc.fileSize)} · {formatDate(doc.createdAt)}</p>
    </div>
    <Badge
      variant={doc.status === 'ready' ? 'success' : doc.status === 'failed' ? 'destructive' : 'warning'}
      className="text-2xs shrink-0"
    >
      {doc.status}
    </Badge>
  </button>
);

// ─── Stats card ───────────────────────────────────────────────────────────────

interface StatBoxProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: number | string;
  hint?: string;
  color?: string;
}

const StatBox: React.FC<StatBoxProps> = ({ icon: Icon, label, value, hint, color = 'text-muted-foreground' }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

// ─── Dashboard Home ───────────────────────────────────────────────────────────

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDocumentStats()
      .then((s) => { if (mounted) setStats(s); })
      .catch(() => { /* stats failure is non-critical */ })
      .finally(() => { if (mounted) setStatsLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title={`${getGreeting()}, ${firstName} 👋`}
        description="Here's your academic workspace. Pick up where you left off or start something new."
        badge={<Badge variant="secondary" className="text-xs">Your study desk</Badge>}
      />

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            icon={Bot}
            label="Ask AI"
            description="Chat with your AI tutor about any topic or concept."
            to="/dashboard/ai-tutor"
            color="bg-primary/10"
            iconColor="text-primary"
          />
          <QuickAction
            icon={Upload}
            label="Upload Document"
            description="Add lecture notes, textbooks, or PDFs to your library."
            to="/dashboard/documents"
            color="bg-success/10"
            iconColor="text-success"
          />
          <QuickAction
            icon={ListChecks}
            label="Generate Quiz"
            description="Create AI-powered practice quizzes from your material."
            to="/dashboard/quizzes"
            color="bg-warning/10"
            iconColor="text-warning"
          />
          <QuickAction
            icon={CalendarDays}
            label="Plan Study"
            description="Build a personalised study schedule for your exams."
            to="/dashboard/planner"
            color="bg-destructive/10"
            iconColor="text-destructive"
          />
        </div>
      </section>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent documents */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Recent Documents
                  </CardTitle>
                  <CardDescription className="mt-0.5">Your most recently uploaded files</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/dashboard/documents')}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !stats || stats.recent.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No documents yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Start by uploading your first PDF document.
                  </p>
                  <Button
                    size="sm"
                    leftIcon={<Upload className="h-3.5 w-3.5" />}
                    onClick={() => navigate('/dashboard/documents')}
                  >
                    Upload a document
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border -mx-1">
                  {stats.recent.map((doc) => (
                    <RecentDocRow
                      key={doc._id}
                      doc={doc as Document}
                      onClick={() => navigate(`/dashboard/documents/${doc._id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Account */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Account</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium truncate max-w-[140px]">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="primary" className="capitalize">{user?.role}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Joined</span>
                <span className="text-foreground text-xs">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/dashboard/settings')}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* AI features status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                Workspace tools
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2.5" aria-label="Workspace tools">
                {[
                  { label: 'PDF Upload', status: true },
                  { label: 'Text Extraction', status: true },
                  { label: 'AI summaries', status: true, note: 'Requires AI key' },
                  { label: 'Document questions', status: true, note: 'Requires AI key' },
                  { label: 'Study chat', status: true, note: 'Requires AI key' },
                ].map(({ label, status, note }) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {status
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                        : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      }
                      <span className={status ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                    </div>
                    {note && <span className="text-xs text-warning">{note}</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Study overview — real stats */}
      <section aria-labelledby="study-overview-heading">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Study Overview
                </CardTitle>
                <CardDescription>Your document library at a glance</CardDescription>
              </div>
              {!statsLoading && (
                <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard/documents')}>
                  Manage documents
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {statsLoading ? (
              <div className="grid sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => <Skeleton key={n} className="h-24 rounded-lg" />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                <StatBox
                  icon={FileText}
                  label="Documents uploaded"
                  value={stats?.total ?? 0}
                  hint={stats?.total === 0 ? 'Upload your first PDF' : `${stats?.ready ?? 0} ready`}
                  color="text-primary"
                />
                <StatBox
                  icon={RefreshCw}
                  label="Processing"
                  value={stats?.processing ?? 0}
                  hint={stats?.processing ? 'Being processed now' : 'None processing'}
                  color="text-warning"
                />
                <StatBox
                  icon={ListChecks}
                  label="Quizzes taken"
                  value={0}
                  hint="Practice with your notes or a topic"
                  color="text-muted-foreground"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default DashboardHome;
