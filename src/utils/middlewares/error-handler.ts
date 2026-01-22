import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/index.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    console.log(`Error: ${req.method} ${req.url} - ${err.message}`);

    return res.status(err.status).json({
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  console.log(`Unhandled Error: ${err}`);

  res.status(500).json({
    message: 'Somthing went wrong, please try again later!',
  });
};
