import express from 'express';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { corsMiddleware, securityHeaders } from './config/cors';
import credentialsRouter from './app/api/credentials';
import { specs, swaggerUi, swaggerUiOptions } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI setup
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(specs, swaggerUiOptions));

// API routes
app.use('/v1/credentials', credentialsRouter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Stellar Credential API'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Stellar Credential API running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 Swagger UI: http://localhost:${PORT}/`);
});