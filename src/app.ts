import 'dotenv/config'; // Load environment variables from .env file to process.env

import express, { Request, Response } from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUI from 'swagger-ui-express';

import { errorHandler } from './utils/middlewares/error-handler.js';
import router from './routes/index.js';
import swaggerDocs from './swagger-output.json' with { type: 'json' };

// Create an Express application
const app = express();

// parses incoming JSON request bodies and makes them available on req.body
app.use(express.json({ limit: '100mb' }));
// Parses URL-encoded form data (including nested objects) into req.body, with a 100MB size limit.
app.use(
  express.urlencoded({
    limit: '100mb',
    extended: true,
  })
);
// parses cookies from the request header and puts them into req.cookies
app.use(cookieParser());

// log request info (logger)
app.use(morgan('dev'));

// Health check route
app.get('/auth-health', (req, res) => {
  res.send('Hello from auth service!');
});

// routes...
app.use('/api', router);

// Swagger API documentation route
app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.get('/api/docs-json', (req: Request, res: Response) => {
  res.json(swaggerDocs);
});

// error handler middleware
app.use(errorHandler);

// server's port
const PORT = process.env.PORT;
// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/`);
});
