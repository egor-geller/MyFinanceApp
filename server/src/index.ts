import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRouter from './routes/auth.js';
import goalsRouter from './routes/goals.js';
import entriesRouter from './routes/entries.js';
import withdrawalsRouter from './routes/withdrawals.js';
import profileRouter from './routes/profile.js';
import exportRouter from './routes/export.js';
import importRouter from './routes/import.js';

import { startWeeklyReminder } from './jobs/weeklyReminder.js';
import { startMonthlyReport } from './jobs/monthlyReport.js';
import { getRates } from './services/currencyRate.js';
import { requireAuth, AuthRequest } from './middleware/auth.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true },
});

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    socket.data.userId = payload.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId: number = socket.data.userId;
  socket.join(`user:${userId}`);
});

// Attach io to app so routes can emit events
app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/goals/:goalId/entries', entriesRouter);
app.use('/api/goals/:goalId/withdrawals', withdrawalsRouter);
app.use('/api/goals/:goalId/export', exportRouter);
app.use('/api/profile', profileRouter);
app.use('/api/import', importRouter);

// Currency rates endpoint
app.get('/api/currency/rates', requireAuth, async (req: AuthRequest, res) => {
  const base = (req.query.base as string) ?? 'ILS';
  const rates = await getRates(base);
  res.json({ base, rates });
});

startWeeklyReminder();
startMonthlyReport();

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
