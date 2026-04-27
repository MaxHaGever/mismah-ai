import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';
import aiRoutes from './routes/aiPdfRoutes';
import adminRoutes from './routes/adminRoutes';

import { protect } from './middleware/authMiddleware';
import { requireOnboarding } from './middleware/requireOnboarding';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

app.use(cors({ origin: allowedOrigin }));
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use(
  '/uploads',
  helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }),
  express.static(path.join(__dirname, '../uploads'))
);

app.use('/api', authRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'API is running' });
});

app.use(protect);

app.use('/api/uploads', uploadRoutes);

app.use(requireOnboarding);
app.use('/api', aiRoutes);          
app.use('/api/admin', adminRoutes);


app.use(errorHandler);


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
