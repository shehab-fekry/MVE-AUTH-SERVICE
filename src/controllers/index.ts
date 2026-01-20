import { Request, Response } from 'express';

export const signin = (req: Request, res: Response) => {
  res.send('Hello from sigin!');
};

export const signup = (req: Request, res: Response) => {
  res.send('Hello from signup!');
};
