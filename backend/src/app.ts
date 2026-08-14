import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { tr } from 'zod/v4/locales';
import prisma from './prisma';

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Online Course Management API',
      version: '1.0.0',
      description: 'API Documentation for Graduation Thesis LMS Project',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.users.count();

    res.status(200).json({
      status: 'success',
      message: 'Backend server Node 22 & PostgresSql connected successfully!',
      totalUser: userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Backend server Node 22 & PostgresSql connected failed!',
      timestamp: new Date().toISOString(),
    })
  }

});

export default app;
