import React, { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, Check, Clock3, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/services/api';
import {
  createStudyTask,
  deleteStudyTask,
  getStudyTasks,
  updateStudyTask,
} from '@/services/plannerService';
import { StudyPriority, StudyTask } from '@/types';

const localDateInput = (date: Date): string => {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
};

const PlannerPage: React.FC = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState(localDateInput(new Date()));
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [priority, setPriority] = useState<StudyPriority>('medium');

  useEffect(() => {
    let active = true;
    getStudyTasks()
      .then((items) => { if (active) setTasks(items); })
      .catch((error: unknown) => {
        if (active) showToast('error', 'Could not load your plan', getErrorMessage(error));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !dueDate) return;

    setSaving(true);
    try {
      const task = await createStudyTask({
        title: title.trim(),
        subject: subject.trim(),
        dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
        durationMinutes,
        priority,
      });
      setTasks((current) => [...current, task].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setTitle('');
      setSubject('');
      showToast('success', 'Study session added');
    } catch (error) {
      showToast('error', 'Could not add this session', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task: StudyTask) => {
    try {
      const updated = await updateStudyTask(task._id, { completed: !task.completed });
      setTasks((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (error) {
      showToast('error', 'Could not update this session', getErrorMessage(error));
    }
  };

  const removeTask = async (task: StudyTask) => {
    try {
      await deleteStudyTask(task._id);
      setTasks((current) => current.filter((item) => item._id !== task._id));
      showToast('success', 'Study session removed');
    } catch (error) {
      showToast('error', 'Could not remove this session', getErrorMessage(error));
    }
  };

  const openTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const totalMinutes = openTasks.reduce((sum, task) => sum + task.durationMinutes, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Study planner"
        description="Turn the next thing you need to do into a small, realistic session."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Sessions ahead', value: openTasks.length },
          { label: 'Time planned', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` },
          { label: 'Completed', value: completedTasks.length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Plan a study session</h2>
            <p className="mt-1 text-sm text-muted-foreground">Keep the task specific and give it a time that fits.</p>
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-sm font-medium text-foreground sm:col-span-2 lg:col-span-3">
              What will you study?
              <input
                required
                maxLength={160}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Review process scheduling"
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Subject
              <input
                maxLength={100}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Computer science"
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Date
              <input
                required
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Minutes
              <input
                required
                type="number"
                min={5}
                max={480}
                step={5}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as StudyPriority)}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Normal</option>
                <option value="high">Important</option>
              </select>
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-6">
              <Button type="submit" isLoading={saving} className="w-full sm:w-auto">Add to my plan</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="upcoming-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="upcoming-heading" className="text-sm font-semibold text-foreground">Upcoming sessions</h2>
          <span className="text-xs text-muted-foreground">{openTasks.length} planned</span>
        </div>
        {loading ? (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">Loading your plan…</div>
        ) : openTasks.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" aria-hidden="true" />}
            title="Your plan is clear"
            description="Add one small study session above to give your next study block a place to start."
          />
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <Card key={task._id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => void toggleTask(task)}
                    aria-label={`Mark ${task.title} complete`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-transparent transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {task.subject && <span>{task.subject}</span>}
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString()}</span>
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{task.durationMinutes} min</span>
                    </p>
                  </div>
                  <span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-medium capitalize sm:inline-flex ${
                    task.priority === 'high' ? 'bg-destructive/10 text-destructive' : task.priority === 'low' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'
                  }`}>
                    {task.priority === 'high' ? 'Important' : task.priority}
                  </span>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${task.title}`} onClick={() => void removeTask(task)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {completedTasks.length > 0 && (
        <section aria-labelledby="completed-heading">
          <h2 id="completed-heading" className="mb-3 text-sm font-semibold text-muted-foreground">Done</h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <Card key={task._id} className="opacity-75">
                <CardContent className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => void toggleTask(task)}
                    aria-label={`Reopen ${task.title}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <p className="flex-1 truncate text-sm text-muted-foreground line-through">{task.title}</p>
                  <span className="text-xs text-muted-foreground">{task.durationMinutes} min</span>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${task.title}`} onClick={() => void removeTask(task)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PlannerPage;
