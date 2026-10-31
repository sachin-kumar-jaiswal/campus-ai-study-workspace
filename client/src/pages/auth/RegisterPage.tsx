import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { RegisterCredentials } from '@/types';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Password strength helpers
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score === 3) return { score, label: 'Fair', color: 'bg-warning' };
  return { score, label: 'Strong', color: 'bg-success' };
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const strength = getPasswordStrength(form.password);

  // ─── Client-side validation ───────────────────────────────────────────────

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.name.trim()) {
      next.name = 'Full name is required';
    } else if (form.name.trim().length < 2) {
      next.name = 'Name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      next.email = 'Enter a valid email address';
    }

    if (!form.password) {
      next.password = 'Password is required';
    } else if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      next.password = 'Must include uppercase, lowercase, and a number';
    }

    if (!form.confirmPassword) {
      next.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(form);
      showToast('success', 'Account created!', 'Welcome to CampusAI. Let\'s start learning.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setServerError(message);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your personal study workspace."
    >
      <form onSubmit={handleSubmit} noValidate aria-label="Registration form">
        {serverError && (
          <div className="mb-5">
            <Alert
              variant="error"
              message={serverError}
              onDismiss={() => setServerError('')}
            />
          </div>
        )}

        <div className="space-y-4">
          {/* Full name */}
          <Input
            label="Full name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Johnson"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            leftIcon={<User className="h-4 w-4" />}
            required
            disabled={isLoading}
          />

          {/* Email */}
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            leftIcon={<Mail className="h-4 w-4" />}
            required
            disabled={isLoading}
          />

          {/* Password */}
          <div>
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={<Lock className="h-4 w-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
              disabled={isLoading}
            />

            {/* Password strength meter */}
            {form.password && (
              <div className="mt-2 space-y-1" aria-live="polite" aria-label={`Password strength: ${strength.label}`}>
                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength:{' '}
                  <span
                    className={
                      strength.score <= 2
                        ? 'text-destructive'
                        : strength.score === 3
                        ? 'text-warning'
                        : 'text-success'
                    }
                  >
                    {strength.label}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <Input
            label="Confirm password"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            leftIcon={<Lock className="h-4 w-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          size="lg"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          By creating an account you agree to our{' '}
          <span className="text-foreground">Terms of Service</span> and{' '}
          <span className="text-foreground">Privacy Policy</span>.
        </p>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
