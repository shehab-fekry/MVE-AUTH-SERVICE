import { Request, Response } from 'express';
import { registerValidation } from '../utils/func/register-validation.js';
import { prisma } from '../lib/prisma.js';
import { ValidationError } from '../utils/errors/index.js';

export const signin = (req: Request, res: Response) => {
  res.send('Hello from sigin!');
};

export const signup = async (req: Request, res: Response) => {
  const { email } = req.body;

  // Validate user registration data
  registerValidation(req.body, 'user');

  // Check if user already exists
  const userExist = await prisma.users.findUnique({
    where: { email },
  });
  if (userExist) {
    throw new ValidationError('User already exists with this email!');
  }

  // Create new user
  const newUser = await prisma.users.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    },
  });
  if (!newUser) {
    throw new Error('Failed to create new user!');
  }

  res.status(201).json({ message: 'User created successfully!' });
};
