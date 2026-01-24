import { NextFunction } from 'express';
import crypto from 'crypto';

import { redis } from '../../../libs/redis.js';
import { ValidationError } from '../../errors/index.js';
import { sendEmail } from '../email/index.js';

export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
) => {
  // normal lock
  if (await redis.get(`otp-atmp-lock:${email}`)) {
    return next(
      new ValidationError(
        'Account locked due to multiple failed attempts! try again after 30 minutes.'
      )
    );
  }

  // spam lock
  if (await redis.get(`otp-gen-lock:${email}`)) {
    return next(
      new ValidationError(
        'Too many OTP generating requests. Please wait 1 hour before requesting again.'
      )
    );
  }
  // cooldown between OTP requests
  if (await redis.get(`otp-cooldown:${email}`)) {
    return next(
      new ValidationError(
        'Please wait 1 minute before requesting new OTP!'
      )
    );
  }
};

export const trackOtpRequests = async (
  email: string,
  next: NextFunction
) => {
  // get number of OTP requests in the last 1 hour
  const optRequests = parseInt(
    (await redis.get(`otp-request-count:${email}`)) || '0'
  );

  // if more than 2 requests in the last 1 hour, lock for 1 hour
  if (optRequests >= 2) {
    await redis.set(`otp-gen-lock:${email}`, 'true', 'EX', 3600);
    return next(
      new ValidationError(
        'Too many OTP generating requests. Please wait 1 hour before requesting again.'
      )
    );
  }

  // track OTP requests for the next 1 hour
  await redis.set(
    `otp-request-count:${email}`,
    optRequests + 1,
    'EX',
    3600
  );
};

export const sendOtp = async (
  email: string,
  name: string,
  template: string
) => {
  // generate a random OTP
  const otp = crypto.randomInt(1000, 9999);
  // send email with generated OTP
  sendEmail(email, 'Email Activiation', template, { name, otp });
  // store OTP in redis for 5 minutes
  await redis.set(`otp:${email}`, otp, 'EX', 300); // 5 minutes
  // store OTP cooldown for 1 minute
  await redis.set(`otp-cooldown:${email}`, 'true', 'EX', 60); // 1 minute
};
