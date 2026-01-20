import 'dotenv/config'; // Load environment variables from .env file

import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { errorHandler } from './utils/middlewares/error-handler.js';
import router from './routes/index.js';

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

// routes...
app.get('/auth-health', (req, res) => {
  res.send('Hello from auth service!');
});

app.use('/api', router);

// error handler middleware
app.use(errorHandler);

// server's port
const PORT = process.env.PORT;
// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/`);
});
