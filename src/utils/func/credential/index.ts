import 'dotenv/config'; // Load environment variables from .env file to process.env

import { Response } from 'express';

export const setCookies = (
  res: Response,
  payload: Record<string, any>
) => {
  const isProd = process.env.NODE_ENV === 'production';

  for (const key in payload) {
    res.cookie(key, payload[key], {
      httpOnly: true, // prevents JavaScript from accessing the cookie. (protects against XSS attacks)
      secure: isProd, // cookie is only sent over HTTPS. (production → always true)
      sameSite: 'lax',
      maxAge:
        key === 'accessToken' ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });
  }
};
