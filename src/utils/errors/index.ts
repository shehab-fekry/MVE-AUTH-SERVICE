// A class-based error handling system for an application
export class AppError extends Error {
  public readonly status: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    status: number,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.status = status;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid Inputs', details?: any) {
    super(message, 403, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized Access') {
    super(message, 401);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication Failed') {
    super(message, 401);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

export class timeoutError extends AppError {
  constructor(message = 'Request Timeout') {
    super(message, 408);
  }
}

export class DataBaseError extends AppError {
  constructor(message = 'Database Error', details?: any) {
    super(message, 500, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}
