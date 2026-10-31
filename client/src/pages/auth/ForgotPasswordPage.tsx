import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { requestPasswordResetApi } from '@/services/authService';
import { getErrorMessage } from '@/services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await requestPasswordResetApi(email.trim());
      setSubmitted(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your account email and we will send you a reset link."
    >
      {submitted ? (
        <div className="space-y-5">
          <Alert
            variant="success"
            message="If an account exists for this email, a password reset link has been sent. Check your inbox."
          />
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary font-medium hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-label="Forgot password form">
          {error && (
            <div className="mb-5">
              <Alert variant="error" message={error} onDismiss={() => setError('')} />
            </div>
          )}
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            required
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="w-full mt-6"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading || !email.trim()}
          >
            Send reset link
          </Button>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
