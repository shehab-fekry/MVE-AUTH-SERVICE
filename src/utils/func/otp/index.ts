import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

import { redis } from '../../../libs/redis.js';
import { sendEmail } from '../email/index.js';
import { prisma } from '../../../libs/prisma.js';
import {
  AuthenticationError,
  ValidationError,
} from '../../errors/index.js';

export const checkOtpRestrictions = async (
  email: string,
  type: 'all' | 'atmp' | 'gen' | 'cooldown' = 'all'
) => {
  // normal lock
  if (
    (type == 'all' || type == 'atmp') &&
    (await redis.get(`otp-atmp-lock:${email}`))
  ) {
    throw new ValidationError(
      'Account locked due to multiple failed attempts! try again after 30 minutes.'
    );
  }

  // spam lock
  if (
    (type == 'all' || type == 'gen') &&
    (await redis.get(`otp-gen-lock:${email}`))
  ) {
    throw new ValidationError(
      'Too many OTP generating requests. Please wait 1 hour before requesting again.'
    );
  }
  // cooldown between OTP requests
  if (
    (type == 'all' || type == 'cooldown') &&
    (await redis.get(`otp-cooldown:${email}`))
  ) {
    throw new ValidationError(
      'Please wait 1 minute before requesting new OTP!'
    );
  }
};

export const trackOtpRequests = async (email: string) => {
  // get number of OTP requests in the last 1 hour
  const optRequests = parseInt(
    (await redis.get(`otp-req-count:${email}`)) || '0'
  );

  // if more than 3 requests, lock for 1 hour
  if (optRequests > 2) {
    await redis.set(`otp-gen-lock:${email}`, 'locked', 'EX', 3600);
    throw new ValidationError(
      'Too many OTP requests. Please wait 1 hour before requesting again.'
    );
  }

  // track OTP requests for the next 1 hour
  await redis.set(
    `otp-req-count:${email}`,
    optRequests + 1,
    'EX',
    3600
  );
};

export const trackOtpAttempts = async (email: string) => {
  // get number of OTP attempts
  const atmpCount = Number(
    (await redis.get(`otp-atmp-count:${email}`)) || '0'
  );

  // check if account locked
  if (await redis.get(`otp-atmp-lock:${email}`)) {
    throw new ValidationError(
      'Account locked due to multiple failed attempts! try again after 30 minutes.'
    );
  }

  // check if more than 3 failed attempts
  if (atmpCount >= 2) {
    // lock account for 30 minutes
    await redis.set(`otp-atmp-lock:${email}`, 'locked', 'EX', 1800);
    // clear attempts count and otp
    await redis.del(`otp:${email}`);
    await redis.del(`otp-atmp-count:${email}`);
    // throw account locked error
    throw new ValidationError(
      'Account locked due to multiple failed attempts! try again after 30 minutes.'
    );
  }

  // increment OTP attempts count for the next 30 minutes
  const newAtmpCount = atmpCount + 1;
  await redis.set(
    `otp-atmp-count:${email}`,
    newAtmpCount,
    'EX',
    1800
  );

  // throw invalid OTP error
  throw new ValidationError(
    `Incorrect OTP code - ${3 - newAtmpCount} attempts left.`
  );
};

export const sendOtp = async (
  email: string,
  name: string,
  subject: string,
  template: string
) => {
  // generate a random OTP
  const otp = crypto.randomInt(1000, 9999);
  // send email with generated OTP
  sendEmail(email, subject, template, { name, otp });
  // store OTP in redis for 5 minutes
  await redis.set(`otp:${email}`, otp, 'EX', 300);
  // store OTP cooldown for 1 minute
  await redis.set(`otp-cooldown:${email}`, 'true', 'EX', 60);
};

export const verifyOtp = async (email: string, otp: string) => {
  // check if OTP is not valid or expired
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new AuthenticationError('OTP is not valid or expired!');
  }

  // check OTP restriction
  await checkOtpRestrictions(email, 'atmp');

  // compare otp with storedOtp
  if (otp !== storedOtp) {
    // track OTP attempts
    await trackOtpAttempts(email);
  } else {
    // clear cached otp, otp-atmp-count
    await redis.del(`otp:${email}`);
    await redis.del(`otp-atmp-count:${email}`);
  }
};

export const handleForgotPassword = async (
  req: Request,
  res: Response,
  userType: 'user' | 'seller'
) => {
  const { email } = req.body;

  // check if email exists
  if (!email) {
    throw new ValidationError('Email is Required!');
  }

  // chack if user/seller exist in DB
  const userExist = await prisma.users.findUnique({
    where: { email },
  });
  if (!userExist) {
    throw new AuthenticationError(`${userType} not found!`);
  }

  // check OTP restrictions
  await checkOtpRestrictions(email);
  // track OTP requests
  await trackOtpRequests(email);
  // generate OTP and send email
  sendOtp(
    email,
    userExist.name,
    'Forgot Password',
    'forgot-password'
  );

  // successful response
  res.status(200).json({
    message: 'OTP sent to email, please verify your account.',
  });
};

export const handleVerifyForgotPassword = async (
  req: Request,
  res: Response
) => {
  const { email, otp } = req.body;

  // check if email and OTP doesn't exist
  if (!email || !otp) {
    throw new ValidationError('Email and OTP are required!');
  }

  // verify OTP
  await verifyOtp(email, otp);

  res.status(200).json({
    message: 'OTP verified successfully!',
  });
};

export const handleRestPassword = async (
  req: Request,
  res: Response,
  userType: 'user' | 'seller'
) => {
  const { email, newPassword, confirmPassword } = req.body;

  // validate email, pass and confirmPass
  if (!email || !newPassword) {
    throw new ValidationError('Email and password are required!');
  }

  // compare pass and confirmPass
  if (newPassword !== confirmPassword) {
    throw new ValidationError(
      "New password and confirm password fields don't match."
    );
  }

  // check if user exists
  const userExists = await prisma.users.findUnique({
    where: { email },
  });
  if (!userExists) {
    throw new AuthenticationError(`${userType} not found!`);
  }

  const isSame = await bcrypt.compare(
    newPassword,
    userExists.password!
  );
  if (isSame) {
    throw new ValidationError(
      'New password cannot be the same as old password!'
    );
  }

  // hash newPass
  const hashedPass = await bcrypt.hash(newPassword, 10);

  // update user pass
  await prisma.users.update({
    where: { email },
    data: {
      password: hashedPass,
    },
  });

  // clear redis cached otp, gen-count and cooldown
  await redis.del(`otp:${email}`);
  await redis.del(`otp-cooldown:${email}`);
  await redis.del(`otp-req-count:${email}`);

  res.status(200).json({
    mesage: 'Password reset successfully!',
  });
};
