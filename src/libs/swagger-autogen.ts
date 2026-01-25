import 'dotenv/config'; // Load environment variables from .env file to process.env
import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Auth Service API Docs',
    description: 'API documentation for the Auth Service',
    version: '1.0.0',
  },
  host: `localhost:${process.env.PORT}`,
  basePath: '/api',
  schemes: ['http'],
};

const outputFile = './src/swagger-output.json';
const endpointsFiles = ['../routes/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
