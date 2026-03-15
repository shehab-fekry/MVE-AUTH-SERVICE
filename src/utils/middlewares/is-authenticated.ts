/* eslint-disable @typescript-eslint/no-unused-vars */

import 'dotenv/config'; // Load environment variables from .env file to process.env

import { NextFunction, Request, Response } from 'express';
import {
  AuthenticationError,
  ValidationError,
} from '../errors/index.js';
import Jwt from 'jsonwebtoken';
import { prisma } from '../../libs/prisma.js';

const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken =
      req.cookies.accessToken ||
      req.headers.authorization?.split(' ')[1];

    // check if accessToken recieved
    if (!accessToken) {
      throw new AuthenticationError(
        'Unauthorized Access! token needed.'
      );
    }

    const decoded = Jwt.verify(
      accessToken,
      String(process.env.ACCESS_TOKEN_SECRET)
    ) as { id: string; role: string };

    // verify accessToken with secret key
    if (!decoded || !decoded.id || !decoded.role) {
      throw new AuthenticationError('Invalid token.');
    }

    const userExist = await prisma.users.findUnique({
      where: { id: decoded.id },
    });

    // check if user exist
    if (!userExist) {
      throw new ValidationError(
        "User doesn't exist with this email."
      );
    }

    // exclude sensitive info
    const { password, createdAt, updatedAt, ...rest } = userExist;
    // store user info in req object (used by 'user-login' route to send user info)
    // @ts-expect-error - property user dosn't exist in req object
    req.user = rest;

    return next(); // go to next middleware
  } catch (error) {
    next(error);
  }
};

export default isAuthenticated;
