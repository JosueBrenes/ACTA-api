import express from 'express';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { corsMiddleware, securityHeaders } from './middleware/cors';
import credentialsRouter from './routes/credentials';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/credentials', credentialsRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Stellar Credential API'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Stellar Credential API',
    version: '1.0.0',
    endpoints: {
      'POST /api/credentials': 'Create a new credential with contract deployment',
      'GET /api/credentials/:contractId': 'Get credential information from contract',
      'PATCH /api/credentials/:contractId/status': 'Update credential status in contract',
      'GET /health': 'Health check endpoint'
    }
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
  console.log(`📖 API docs: http://localhost:${PORT}/`);
});