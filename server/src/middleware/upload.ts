import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10);
const MAX_BYTES = MAX_MB * 1024 * 1024;

/**
 * Multer is configured with memoryStorage so the file buffer lives in memory
 * until the document service explicitly writes it via storageService.saveFile().
 * This keeps storage logic inside the service layer, not scattered in middleware.
 */
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  // Accept only application/pdf
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter,
});

export default upload;
