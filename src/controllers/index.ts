import 'dotenv/config'; // Load environment variables from .env file to process.env

import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { prisma } from '../libs/prisma.js';
import { registerValidation } from '../utils/func/validation/index.js';
import {
  AuthenticationError,
  ValidationError,
} from '../utils/errors/index.js';
import {
  checkOtpRestrictions,
  trackOtpRequests,
  sendOtp,
  handleForgotPassword,
  handleVerifyForgotPassword,
  handleRestPassword,
  verifyOtp,
} from '../utils/func/otp/index.js';
import { setCookies } from '../utils/func/credential/index.js';
import { userRole } from '../constants/index.js';

// register new user
export const userRegisteration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, name, role } = req.body;

  // Validate user registration data
  registerValidation(req.body);

  // Check if user already exists
  const userExist = await prisma.users.findUnique({
    where: { email },
  });

  if (userExist) {
    return next(
      new ValidationError('User already exists with this email!')
    );
  }

  try {
    // check OTP restrictions
    await checkOtpRestrictions(email);
    // track OTP requests
    await trackOtpRequests(email);
    // send OTP to email
    await sendOtp(
      name,
      email,
      'Email Activiation',
      role === userRole.CUSTOMER
        ? 'customer-activation'
        : 'seller-activation'
    );

    res.status(200).json({
      message: 'OTP sent to email, please check you account.',
    });
  } catch (err) {
    return next(err);
  }
};

// verify user with OTP
export const userVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, phoneNumber, country, otp, role } =
      req.body;

    if (
      !role ||
      (role !== userRole.CUSTOMER && role !== userRole.SELLER)
    ) {
      throw new ValidationError('Invalid user role!');
    }

    // check if email, password and OTP are provided
    if (
      !name ||
      !email ||
      !password ||
      !otp ||
      (role === userRole.SELLER && (!phoneNumber || !country))
    ) {
      throw new ValidationError('All fields are required!');
    }

    // check if email exists
    const userExist = await prisma.users.findUnique({
      where: { email },
    });
    if (userExist) {
      throw new AuthenticationError(
        'User already verified, Please login.'
      );
    }

    // verify OTP
    await verifyOtp(email, otp);

    // Hashing password
    const hashedPass = await bcrypt.hash(password, 10);

    // create new user
    await prisma.users.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: hashedPass,
        ...(role === userRole.SELLER && {
          phoneNumber,
          country,
        }),
        role,
      },
    });

    res.status(201).json({ message: 'User created successfully!' });
  } catch (err) {
    return next(err);
  }
};

// login user
export const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // validate email and password
    if (!email || !password) {
      throw new ValidationError('Email and password are required!');
    }
    // check if user exist
    const userExist = await prisma.users.findUnique({
      where: { email },
    });

    if (!userExist) {
      throw new AuthenticationError(
        "User doesn't exist with provided email, please signup first."
      );
    }

    // compare password
    const isMatch = await bcrypt.compare(
      password,
      userExist.password!
    );
    if (!isMatch) {
      throw new AuthenticationError('Invalid Email or password!');
    }

    // generate access token
    const accessToken = jwt.sign(
      {
        id: userExist.id,
        name: userExist.name,
        role: userExist.role,
      },
      `${process.env.ACCESS_TOKEN_SECRET}`,
      { expiresIn: '15m' }
    );

    // generate refresh token
    const refreshToken = jwt.sign(
      {
        id: userExist.id,
        name: userExist.name,
        role: userExist.role,
      },
      `${process.env.REFRESH_TOKEN_SECRET}`,
      {
        expiresIn: '2d',
      }
    );

    // set cookies to response object
    setCookies(res, { accessToken, refreshToken });

    res.status(200).json({
      message: 'login successful!',
      user: {
        id: userExist.id,
        name: userExist.name,
        email: userExist.email,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// get logged-in user info
export const userInfo = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as Request & { user: any }).user;

  try {
    res.status(200).json({ user: user });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.cookies;

    // check if refreshToken is recieved
    if (!refreshToken) {
      throw new ValidationError('Unauthorized! no refresh token.');
    }

    // decode refresh token
    const decoded = jwt.verify(
      refreshToken,
      `${process.env.REFRESH_TOKEN_SECRET}`
    ) as jwt.JwtPayload;

    // check decoded payload
    if (!decoded || !decoded.id || !decoded.name) {
      throw new JsonWebTokenError(
        'Forbidden! Invalid refresh token!'
      );
    }

    // check if user exists
    const userExists = await prisma.users.findUnique({
      where: { id: decoded.id },
    });
    if (!userExists) {
      throw new AuthenticationError('Forbidden! user not found.');
    }

    // generate new accessToken
    const newAcccessToken = jwt.sign(
      {
        id: userExists.id,
        name: userExists.name,
        role: userExists.role,
      },
      `${process.env.ACCESS_TOKEN_SECRET}`,
      {
        expiresIn: '15m',
      }
    );
    // generate new refreshToken (refresh token rotation)
    // optional, you can keep the same refresh token until it expires, but generating a new one is more secure
    const newRefreshToken = jwt.sign(
      {
        id: userExists.id,
        name: userExists.name,
        role: userExists.role,
      },
      `${process.env.REFRESH_TOKEN_SECRET}`,
      { expiresIn: '2d' }
    );

    // append tokens to response cookies
    setCookies(res, {
      accessToken: newAcccessToken,
      refreshToken: newRefreshToken,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// user forgot password
export const forgotUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // shared logic between user/seller
    await handleForgotPassword(req, res);
  } catch (err) {
    return next(err);
  }
};

// verify forgot password with OTP
export const verifyForgotUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // shared logic between user/seller
    await handleVerifyForgotPassword(req, res);
  } catch (err) {
    return next(err);
  }
};

// reset user password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // shared logic between user/seller
    await handleRestPassword(req, res);
  } catch (err) {
    return next(err);
  }
};
