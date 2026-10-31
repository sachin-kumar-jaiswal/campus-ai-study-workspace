/**
 * Centralised JWT configuration.
 * Keeping token settings in one place makes rotation and expiry changes easy.
 */
export const JWT_CONFIG = {
  secret: (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is not set.');
    return secret;
  },
  expiresIn: '7d' as const,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
} as const;
