import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { resetPasswordApi } from '@/services/authService';
import { getErrorMessage } from '@/services/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain an uppercase letter, a lowercase letter, and a number.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordApi(token, password);
      setIsComplete(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a new password for your CampusAI account."
    >
      {isComplete ? (
        <div className="space-y-5">
          <Alert variant="success" message="Your password has been reset successfully." />
          <p className="text-center text-sm">
            <Link to="/login" className="text-primary font-medium hover:underline">
              Go to log in
            </Link>
          </p>
        </div>
      ) : !token ? (
        <div className="space-y-5">
          <Alert
            variant="error"
            message="This password reset link is missing or invalid. Request a new reset link to continue."
          />
          <p className="text-center text-sm">
            <Link to="/forgot-password" className="text-primary font-medium hover:underline">
              Request a new link
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-label="Reset password form">
          {error && (
            <div className="mb-5">
              <Alert variant="error" message={error} onDismiss={() => setError('')} />
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
              minLength={8}
              disabled={isLoading}
            />
            <Input
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full mt-6"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading || password.length < 8 || !confirmPassword}
          >
            Reset password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
