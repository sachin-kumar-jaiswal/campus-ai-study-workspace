import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, FileText, ListChecks, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/context/ToastContext';
import { getDocuments } from '@/services/documentService';
import { createQuiz, deleteQuiz, getQuiz, getQuizzes, submitQuiz } from '@/services/quizService';
import { getErrorMessage } from '@/services/api';
import { Document, QuizDetail, QuizResult, QuizSummary } from '@/types';

const QuizzesPage: React.FC = () => {
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sourceType, setSourceType] = useState<'topic' | 'document'>('topic');
  const [topic, setTopic] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getQuizzes(), getDocuments({ status: 'ready', limit: 50 })])
      .then(([quizItems, documentResult]) => {
        if (!active) return;
        setQuizzes(quizItems);
        setDocuments(documentResult.documents);
      })
      .catch((error: unknown) => {
        if (active) showToast('error', 'Could not load quizzes', getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [showToast]);

  const openQuiz = async (id: string) => {
    try {
      const quiz = await getQuiz(id);
      setActiveQuiz(quiz);
      setAnswers(Array(quiz.questions.length).fill(-1));
      setResult(null);
    } catch (error) {
      showToast('error', 'Could not open quiz', getErrorMessage(error));
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sourceType === 'topic' && topic.trim().length < 2) {
      showToast('warning', 'Add a topic', 'Enter at least two characters to create a quiz.');
      return;
    }
    if (sourceType === 'document' && !documentId) {
      showToast('warning', 'Choose a document', 'Select one of your ready documents first.');
      return;
    }

    setGenerating(true);
    try {
      const created = await createQuiz({
        topic: sourceType === 'topic' ? topic.trim() : undefined,
        documentId: sourceType === 'document' ? documentId : undefined,
        questionCount,
      });
      const [updatedQuizzes, detail] = await Promise.all([
        getQuizzes(),
        getQuiz(created._id),
      ]);
      setQuizzes(updatedQuizzes);
      setTopic('');
      setActiveQuiz(detail);
      setAnswers(Array(detail.questions.length).fill(-1));
      setResult(null);
    } catch (error) {
      showToast('error', 'Could not create quiz', getErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeQuiz || answers.some((answer) => answer < 0)) {
      showToast('warning', 'Finish every question', 'Choose an answer for each question before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const quizResult = await submitQuiz(activeQuiz._id, answers);
      setResult(quizResult);
      setQuizzes(await getQuizzes());
    } catch (error) {
      showToast('error', 'Could not submit quiz', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuiz(id);
      setQuizzes((current) => current.filter((quiz) => quiz._id !== id));
      showToast('success', 'Quiz deleted');
    } catch (error) {
      showToast('error', 'Could not delete quiz', getErrorMessage(error));
    }
  };

  if (activeQuiz) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => { setActiveQuiz(null); setResult(null); }}
        >
          All quizzes
        </Button>

        <PageHeader
          title={activeQuiz.title}
          description={`${activeQuiz.sourceLabel} · ${activeQuiz.questions.length} questions`}
          actions={result ? <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">{result.score}%</span> : undefined}
        />

        <div className="space-y-4">
          {(result?.review ?? activeQuiz.questions).map((question, questionIndex) => {
            const review = result?.review[questionIndex];
            return (
              <Card key={`${activeQuiz._id}-${questionIndex}`}>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {questionIndex + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold leading-6 text-foreground">{question.prompt}</h2>
                      <div className="mt-4 grid gap-2">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = result
                            ? review?.selectedIndex === optionIndex
                            : answers[questionIndex] === optionIndex;
                          const isCorrect = result && review?.correctIndex === optionIndex;
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={Boolean(result)}
                              onClick={() => setAnswers((current) => current.map((value, index) => index === questionIndex ? optionIndex : value))}
                              className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition-colors ${
                                isCorrect
                                  ? 'border-success/40 bg-success/5 text-foreground'
                                  : isSelected
                                    ? 'border-primary/50 bg-primary/5 text-foreground'
                                    : 'border-border text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 text-xs">
                                {isCorrect ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + optionIndex)}
                              </span>
                              <span className="flex-1">{option}</span>
                              {result && isSelected && !isCorrect && <X className="h-4 w-4 text-destructive" />}
                            </button>
                          );
                        })}
                      </div>
                      {review && (
                        <p className="mt-3 rounded-lg bg-muted/50 px-3.5 py-3 text-sm leading-6 text-muted-foreground">
                          {review.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!result && (
          <div className="flex justify-end">
            <Button isLoading={submitting} onClick={handleSubmit} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Check answers
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Quizzes"
        description="Turn a topic or your course notes into useful practice. Your attempts stay here so you can revisit them."
      />

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Make a practice quiz</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a topic or use a ready document as your source.</p>
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-foreground">
                Source
                <select
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value as 'topic' | 'document')}
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="topic">A study topic</option>
                  <option value="document">A document</option>
                </select>
              </label>
              {sourceType === 'topic' ? (
                <label className="block text-sm font-medium text-foreground">
                  Topic
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    maxLength={160}
                    placeholder="e.g. Binary search trees"
                    className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground"
                  />
                </label>
              ) : (
                <label className="block text-sm font-medium text-foreground">
                  Ready document
                  <select
                    value={documentId}
                    onChange={(event) => setDocumentId(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select a PDF</option>
                    {documents.map((document) => <option key={document._id} value={document._id}>{document.title}</option>)}
                  </select>
                </label>
              )}
              <label className="block text-sm font-medium text-foreground">
                Questions
                <select
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm sm:max-w-40"
                >
                  {[3, 5, 8, 10].map((count) => <option key={count} value={count}>{count} questions</option>)}
                </select>
              </label>
            </div>
            <div className="flex items-end">
              <Button type="submit" isLoading={generating} className="w-full sm:w-auto">
                Create quiz
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="saved-quizzes-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="saved-quizzes-heading" className="text-sm font-semibold text-foreground">Your quizzes</h2>
          <span className="text-xs text-muted-foreground">{quizzes.length} saved</span>
        </div>
        {loading ? (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">Loading your quizzes…</div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-6 w-6" aria-hidden="true" />}
            title="Nothing to practice yet"
            description="Create a quiz from one of your documents or choose a topic above."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {quizzes.map((quiz) => (
              <Card key={quiz._id} className="transition-shadow hover:shadow-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {quiz.sourceLabel === quiz.title ? <ListChecks className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <button type="button" onClick={() => void openQuiz(quiz._id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-semibold text-foreground">{quiz.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {quiz.questionCount} questions · {quiz.attemptCount ? `Last score ${quiz.latestScore}%` : 'Not attempted'}
                    </span>
                  </button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${quiz.title}`} onClick={() => void handleDelete(quiz._id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default QuizzesPage;
