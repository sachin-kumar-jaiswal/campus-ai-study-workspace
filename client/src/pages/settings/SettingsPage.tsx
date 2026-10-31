import React, { FormEvent, useState } from 'react';
import { LockKeyhole, Moon, Monitor, Shield, Sun, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/services/api';
import { updatePasswordApi } from '@/services/authService';
import { ThemeMode } from '@/types';

const themeOptions: { mode: ThemeMode; icon: React.FC<{ className?: string }>; label: string; description: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light', description: 'Warm paper tones' },
  { mode: 'dark', icon: Moon, label: 'Dark', description: 'Low-light workspace' },
  { mode: 'system', icon: Monitor, label: 'System', description: 'Follows your device' },
];

const SettingsPage: React.FC = () => {
  const { user, updateName } = useAuth();
  const { theme, setTheme } = useThemeContext();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateName(name.trim());
      showToast('success', 'Profile updated');
    } catch (error) {
      showToast('error', 'Could not update profile', getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('warning', 'Passwords do not match', 'Re-enter the new password and try again.');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      showToast('warning', 'Choose a stronger password', 'Use at least 8 characters, including uppercase, lowercase and a number.');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePasswordApi(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Password updated');
    } catch (error) {
      showToast('error', 'Could not update password', getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-7 animate-fade-in">
      <PageHeader title="Settings" description="Your profile and workspace preferences." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" aria-hidden="true" />
            Profile
          </CardTitle>
          <CardDescription>Update the name shown in your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={user?.name || ''} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-foreground">
              Display name
              <input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
            <Button type="submit" isLoading={savingProfile} disabled={name.trim() === user?.name}>
              Save profile
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-4 w-4 text-primary" aria-hidden="true" />
            Appearance
          </CardTitle>
          <CardDescription>Choose how your study space looks.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme selection">
            {themeOptions.map(({ mode, icon: Icon, label, description }) => {
              const isSelected = theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setTheme(mode)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    isSelected ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
            Security
          </CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Current password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm sm:max-w-md"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-foreground">
                New password
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                Confirm new password
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </label>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              Use at least 8 characters, with an uppercase letter, a lowercase letter and a number.
            </p>
            <Button type="submit" isLoading={savingPassword}>Update password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
