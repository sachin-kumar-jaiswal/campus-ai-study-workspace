import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { apiLimiter } from './middleware/rateLimiter';
import routes from './routes/index';
import errorHandler from './middleware/errorHandler';

// Load environment variables before anything else
dotenv.config();

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet());

const localDevelopmentOrigins = process.env.NODE_ENV === 'production'
  ? []
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.RENDER_EXTERNAL_URL,
  ...localDevelopmentOrigins,
]
  .filter(Boolean)
  .flatMap((origin) => origin!.split(',').map((item) => item.trim()));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/api', apiLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api', routes);

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'The requested API resource was not found.',
  });
});

const clientDist = path.resolve(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: '1d' }));
}

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.get('*', (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(clientDist, 'index.html'))) {
    res.sendFile(path.join(clientDist, 'index.html'));
    return;
  }

  res.status(404).json({
    success: false,
    message: 'The requested page was not found.',
  });
});

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'The requested page was not found.',
  });
});

// ─── Multer Error Handler ────────────────────────────────────────────────────
// Must come before the central error handler to translate multer errors into
// our standard response format.

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_FILE_SIZE_MB || '20';
      res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${maxMb} MB.`,
      });
      return;
    }
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  // Handle fileFilter rejections (non-PDF)
  if (err.message === 'Only PDF files are allowed.') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  next(err);
});

// ─── Centralised Error Handler ────────────────────────────────────────────────

app.use(errorHandler);

export default app;
