const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* =========================
   CORS CONFIG (RENDER SAFE)
   ========================= */

const allowedOrigins = [
  'http://localhost:3000',          // local React
  'https://splitmint-1.onrender.com' // Vercel production
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / server-to-server calls
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

/* =========================
   MIDDLEWARE
   ========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   DATABASE CONNECTION
   ========================= */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/* =========================
   ROUTES
   ========================= */

app.get('/', (req, res) => {
  res.send('SplitMint Backend is running 🚀');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/balance', require('./routes/balance'));

/* =========================
   ERROR HANDLER
   ========================= */

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

/* =========================
   START SERVER
   ========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
