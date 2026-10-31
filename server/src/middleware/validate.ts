import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Reads the result of express-validator chains and returns 400 with
 * structured errors if any validation failed.
 */
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: err.type === 'field' ? err.path : undefined,
      message: err.msg as string,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  next();
};

export default validate;
