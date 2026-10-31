import React, { useEffect, useState } from 'react';
import { BarChart3, BookOpen, CheckCircle2, Clock3, FileText, ListChecks } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/services/api';
import { getStudyAnalytics } from '@/services/analyticsService';
import { StudyAnalytics } from '@/types';

const AnalyticsPage: React.FC = () => {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getStudyAnalytics()
      .then((data) => { if (active) setAnalytics(data); })
      .catch((error: unknown) => {
        if (active) showToast('error', 'Could not load study overview', getErrorMessage(error));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  if (loading) {
    return <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">Gathering your study activity…</div>;
  }
  if (!analytics) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-6 w-6" aria-hidden="true" />}
        title="Your overview could not load"
        description="Try refreshing the page. Your documents and study plan have not been changed."
      />
    );
  }

  const maxMinutes = Math.max(...analytics.weeklyActivity.map((day) => day.minutes), 30);
  const hasActivity = analytics.weeklyActivity.some((day) => day.minutes > 0 || day.quizAttempts > 0);
  const totalHours = Math.floor(analytics.trackedStudyMinutes / 60);
  const remainingMinutes = analytics.trackedStudyMinutes % 60;

  const stats = [
    { label: 'Documents ready', value: analytics.readyDocuments, hint: `${analytics.documents} in your library`, icon: FileText },
    { label: 'Sessions completed', value: analytics.completedTasks, hint: `${analytics.upcomingTasks} still ahead`, icon: CheckCircle2 },
    { label: 'Planned focus time', value: `${totalHours}h ${remainingMinutes}m`, hint: 'From completed sessions', icon: Clock3 },
    { label: 'Quiz average', value: analytics.averageQuizScore === null ? '—' : `${analytics.averageQuizScore}%`, hint: `${analytics.quizAttempts} attempts`, icon: ListChecks },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Study overview"
        description="A clear look at the sessions you planned, the work you finished and the material in your library."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Your last seven days</h2>
              <p className="mt-1 text-xs text-muted-foreground">Completed study time and quiz attempts</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">7 days</span>
          </div>

          {!hasActivity ? (
            <div className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <BookOpen className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 text-sm font-medium text-foreground">Your week starts here</p>
              <p className="mt-1 text-xs text-muted-foreground">Complete a planned session or try a quiz to see your activity.</p>
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-7 gap-2 sm:gap-4">
              {analytics.weeklyActivity.map((day) => {
                const date = new Date(`${day.date}T12:00:00`);
                const barHeight = Math.max(day.minutes ? (day.minutes / maxMinutes) * 100 : 0, day.quizAttempts ? 10 : 4);
                return (
                  <div key={day.date} className="flex flex-col items-center">
                    <span className="mb-2 text-[10px] text-muted-foreground">{day.minutes ? `${day.minutes}m` : day.quizAttempts ? `${day.quizAttempts} quiz` : ''}</span>
                    <div className="flex h-32 w-full items-end justify-center rounded-lg bg-muted/50 p-1.5">
                      <div
                        className={`w-full max-w-8 rounded-t-md ${day.minutes || day.quizAttempts ? 'bg-primary' : 'bg-border'}`}
                        style={{ height: `${barHeight}%` }}
                        title={`${day.minutes} minutes studied, ${day.quizAttempts} quiz attempts`}
                      />
                    </div>
                    <span className="mt-2 text-[10px] text-muted-foreground">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-4 p-5 sm:p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Grounded in your activity</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Study time is calculated from the durations of sessions you mark complete. Quiz results are based on your saved attempts; no activity is estimated or filled in for you.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
