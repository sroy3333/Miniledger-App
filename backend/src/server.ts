import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import loanRoutes from './routes/loans';
import summaryRoutes from './routes/summary';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'MiniLedger' }));
app.use('/api/auth', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/summary', summaryRoutes);

const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('Unhandled API error:', error);
  res.status(500).json({ error: 'Unexpected server error.' });
};
app.use(errors);

const port = Number(process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => console.log(`MiniLedger API listening on http://localhost:${port}`));
