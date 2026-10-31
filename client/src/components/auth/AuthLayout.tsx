import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, MessageCircle } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-background flex">
    {/* Left panel — branding (desktop only) */}
    <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-primary text-primary-foreground flex-col justify-between p-10 xl:p-14">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 group" aria-label="Go to homepage">
        <div className="h-9 w-9 rounded-lg border border-primary-foreground/20 flex items-center justify-center group-hover:bg-primary-foreground/10 transition-colors">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="text-base font-semibold">CampusAI</span>
      </Link>

      {/* Tagline block */}
      <div className="max-w-lg">
        <blockquote>
          <p className="font-display text-4xl leading-tight mb-5 xl:text-5xl">
            "Make room for good work."
          </p>
          <p className="text-sm text-primary-foreground/75 leading-relaxed max-w-sm">
            A quieter place for your course material, your questions and the ideas you are working through.
          </p>
        </blockquote>

        <ul className="mt-9 space-y-4" aria-label="Workspace features">
          {[
            { icon: FileText, label: 'Keep course material close at hand' },
            { icon: MessageCircle, label: 'Talk through a difficult idea' },
            { icon: BookOpen, label: 'Return to where you left off' },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-primary-foreground/85">
              <Icon className="h-4 w-4 text-primary-foreground/60" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} CampusAI
      </p>
    </div>

    {/* Right panel — form */}
    <div className="flex-1 flex flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
      {/* Mobile logo */}
      <div className="lg:hidden mb-8">
        <Link to="/" className="inline-flex items-center gap-2" aria-label="Go to homepage">
          <div className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <span className="text-base font-bold text-foreground">CampusAI</span>
        </Link>
      </div>

      <div className="w-full max-w-sm mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
