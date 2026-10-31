import { AppError } from '../middleware/errorHandler';

const getPasswordResetConfiguration = (): {
  apiKey: string;
  from: string;
  clientUrl: string;
} => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const clientUrl = process.env.CLIENT_URL?.trim() || process.env.RENDER_EXTERNAL_URL?.trim();

  if (!apiKey || !from || !clientUrl) {
    throw new AppError(
      'Password reset email is not configured. Set RESEND_API_KEY, EMAIL_FROM, and CLIENT_URL in the server environment.',
      503
    );
  }

  try {
    new URL(clientUrl);
  } catch {
    throw new AppError('Password reset email has an invalid CLIENT_URL configuration.', 503);
  }

  return { apiKey, from, clientUrl };
};

export const assertPasswordResetEmailConfigured = (): void => {
  getPasswordResetConfiguration();
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const { apiKey, from, clientUrl } = getPasswordResetConfiguration();
  const resetUrl = new URL('/reset-password', clientUrl);
  resetUrl.searchParams.set('token', token);

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Reset your CampusAI password',
        text: `We received a request to reset your CampusAI password. Use this link within 1 hour:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>We received a request to reset your CampusAI password.</p><p><a href="${resetUrl.toString()}">Reset your password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    console.error('[Email] Password reset email delivery failed:', error);
    throw new AppError('Unable to send a password reset email right now. Please try again later.', 503);
  }

  if (!response.ok) {
    console.error(`[Email] Password reset email delivery failed with status ${response.status}.`);
    throw new AppError('Unable to send a password reset email right now. Please try again later.', 503);
  }
};
