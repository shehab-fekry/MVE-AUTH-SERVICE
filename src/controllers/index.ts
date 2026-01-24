import { NextFunction, Request, Response } from 'express';
import { registerValidation } from '../utils/func/validation/index.js';
import { prisma } from '../libs/prisma.js';
import { ValidationError } from '../utils/errors/index.js';
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
} from '../utils/func/otp/index.js';

export const signin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.send('Hello from sigin!');
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, name } = req.body;

  // Validate user registration data
  registerValidation(req.body, 'user');

  // Check if user already exists
  const userExist = await prisma.users.findUnique({
    where: { email },
  });
  if (userExist) {
    return next(
      new ValidationError('User already exists with this email!')
    );
  }

  // check OTP restrictions
  await checkOtpRestrictions(email, next);
  // track OTP requests
  await trackOtpRequests(email, next);
  // send OTP to email
  await sendOtp(email, name, 'user-activation');

  res.status(201).json({
    message: 'OTP sent to email, please check you account.',
  });
};
