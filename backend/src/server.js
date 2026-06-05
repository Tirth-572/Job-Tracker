require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const path = require('path');

const routes = require('./routes');
const workflowRoutes = require('./routes/workflows');
const { errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./services/socketService');
const { initEmailQueue } = require('./services/emailQueue');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true }
});

app.set('io', io);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// CORS preflight
app.options('*', cors());

app.use('/api', routes);
app.use('/api/workflows', workflowRoutes);
app.use(errorHandler);

initSocket(io);
try { initEmailQueue(); } catch (e) { console.warn('Email queue init failed (Redis may be offline):', e.message); }

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
