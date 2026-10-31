import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  FileText,
  MessageCircle,
  PanelLeft,
  Search,
  Upload,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';

const WorkspacePreview = () => (
  <div className="relative mx-auto w-full max-w-[650px]">
    <div className="absolute -left-8 top-12 hidden h-24 w-24 rounded-full border border-primary/10 lg:block" aria-hidden="true" />
    <div className="absolute -bottom-8 right-12 hidden h-28 w-28 rounded-full bg-accent/70 lg:block" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card-hover">
      <div className="flex h-12 items-center justify-between border-b border-border px-4 sm:px-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>CampusAI</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
          Your workspace
        </div>
      </div>

      <div className="grid min-h-[340px] sm:min-h-[380px] sm:grid-cols-[150px_1fr]">
        <aside className="hidden border-r border-border bg-muted/35 p-3 sm:block">
          <p className="px-2 pb-3 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </p>
          <div className="space-y-1">
            {[
              { icon: PanelLeft, label: 'Overview', active: true },
              { icon: FileText, label: 'My documents' },
              { icon: MessageCircle, label: 'Study chat' },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] ${
                  active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-border pt-4">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Recent
            </p>
            <p className="mt-2 truncate px-2 text-[11px] text-muted-foreground">Operating systems</p>
            <p className="mt-2 truncate px-2 text-[11px] text-muted-foreground">Linear algebra notes</p>
          </div>
        </aside>

        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">YOUR STUDY DESK</p>
              <h2 className="mt-1 font-display text-2xl text-foreground sm:text-3xl">A little more focus.</h2>
            </div>
            <div className="hidden rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground sm:block">
              Sample workspace
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-background p-3.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">In your library</p>
              <p className="mt-2 text-xl font-semibold text-foreground">Lecture notes</p>
              <p className="mt-1 text-[11px] text-muted-foreground">PDFs in one place</p>
            </div>
            <div className="rounded-xl border border-border bg-accent/55 p-3.5">
              <p className="text-[10px] uppercase tracking-wide text-accent-foreground/75">A good next step</p>
              <p className="mt-2 text-xl font-semibold text-foreground">Pick up a topic</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Continue where you paused</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
              <p className="text-xs font-semibold">Recently opened</p>
              <button type="button" className="text-[10px] text-primary">View library</button>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">Operating systems — Lecture 04</p>
                <p className="mt-1 text-[10px] text-muted-foreground">PDF · Study notes</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3.5 py-3">
            <Search className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="flex-1 text-[11px] text-muted-foreground">Ask about a document or topic…</span>
            <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">Ask</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section aria-labelledby="hero-heading" className="relative overflow-hidden pb-20 pt-28 sm:pt-32 lg:pb-28 lg:pt-36">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[linear-gradient(to_bottom,hsl(var(--muted)/0.55),transparent)]" aria-hidden="true" />
          <div className="page-container grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <span className="h-px w-7 bg-primary" aria-hidden="true" />
                A workspace for university study
              </div>
              <h1 id="hero-heading" className="font-display text-5xl leading-[1.08] text-foreground sm:text-6xl lg:text-[4.35rem]">
                Clear your desk.
                <span className="mt-1 block text-primary">Find your next step.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Keep your notes, course material and questions together in one calm, practical place.
                Spend less time getting organized and more time understanding the work.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => navigate('/register')} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Create your workspace
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {['Your own private library', 'Made for university work'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <WorkspacePreview />
          </div>
        </section>

        <section id="features" aria-labelledby="features-heading" className="border-y border-border bg-card py-20 sm:py-24">
          <div className="page-container">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Made for the work between lectures</p>
              <h2 id="features-heading" className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
                Your study tools, finally in the same place.
              </h2>
            </div>

            <div className="mt-12 grid gap-0 border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
              {[
                {
                  number: '01',
                  icon: Upload,
                  title: 'Bring in your material',
                  description: 'Keep lecture notes and course PDFs organized in a searchable personal library.',
                },
                {
                  number: '02',
                  icon: MessageCircle,
                  title: 'Work through a question',
                  description: 'Ask about a difficult topic or use your uploaded notes as the context for a conversation.',
                },
                {
                  number: '03',
                  icon: BookOpen,
                  title: 'Return to your thinking',
                  description: 'Pick up recent documents and conversations without searching across scattered apps.',
                },
              ].map(({ number, icon: Icon, title, description }) => (
                <article key={number} className="py-7 md:px-7 md:py-8 first:md:pl-0 last:md:pr-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{number}</span>
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-base font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="how-heading" className="py-20 sm:py-24">
          <div className="page-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">A simpler routine</p>
              <h2 id="how-heading" className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
                Less setup.
                <span className="block text-muted-foreground">More actual study.</span>
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
                Start with the material you already have. Your workspace grows around the way you study.
              </p>
            </div>

            <ol className="divide-y divide-border border-y border-border">
              {[
                { icon: Upload, label: 'Add your course material', description: 'Upload a PDF and keep your notes close at hand.' },
                { icon: Search, label: 'Get oriented quickly', description: 'Find the document you need and see what you were working on.' },
                { icon: MessageCircle, label: 'Ask, review, understand', description: 'Use a tutor conversation to unpack ideas and follow up on questions.' },
              ].map(({ icon: Icon, label, description }, index) => (
                <li key={label} className="flex gap-4 py-5 sm:gap-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-primary">
                    0{index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="our-approach" aria-labelledby="approach-heading" className="pb-20 sm:pb-24">
          <div className="page-container">
            <div className="flex flex-col justify-between gap-8 rounded-2xl bg-primary px-7 py-9 text-primary-foreground sm:px-10 sm:py-12 lg:flex-row lg:items-end lg:px-14">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">A better place to begin</p>
                <h2 id="approach-heading" className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                  Your next study session can start here.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/75">
                  Make a little space for focused work. Bring your course material and build from there.
                </p>
              </div>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/register')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="shrink-0"
              >
                Create an account
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card" role="contentinfo">
        <div className="page-container flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">CampusAI</span>
            <span className="text-xs text-muted-foreground">A focused space for university work.</span>
          </div>
          <nav aria-label="Footer navigation" className="flex gap-5 text-xs text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">Workspace</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#our-approach" className="transition-colors hover:text-foreground">Get started</a>
          </nav>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} CampusAI</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
