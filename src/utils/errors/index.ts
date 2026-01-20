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
  constructor(message = 'Resource Not Found', status = 404) {
    super(message, status);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: 'Validation Error',
    status: 409,
    details: any
  ) {
    super(message, status, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized Access', status = 401) {
    super(message, status);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication Failed', status = 403) {
    super(message, status);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', status = 400) {
    super(message, status);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', status = 500) {
    super(message, status);
  }
}

export class timeoutError extends AppError {
  constructor(message = 'Request Timeout', status = 408) {
    super(message, status);
  }
}

export class DataBaseError extends AppError {
  constructor(
    message = 'Database Error',
    status = 500,
    details?: any
  ) {
    super(message, status, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: 'Too Many Requests', status = 429) {
    super(message, status);
  }
}
