// import 'dotenv/config';
// import express from 'express';
// import cors from 'cors';
// import routes from './routes/index.js';

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Task 1: Comprehensive PocketBase connection debugging
// const pbUrl = process.env.POCKETBASE_URL;
// console.log(`[PocketBase] URL: ${pbUrl || 'UNDEFINED'}`);

// if (!pbUrl) {
//   console.warn('[PocketBase] WARNING: POCKETBASE_URL is not defined in .env file');
// } else {
//   console.log('[PocketBase] Attempting connection...');
//   console.log(`[PocketBase] Connection status: pending (will be tested on first request)`);
// }

// app.use(cors());
// app.use(express.json());
// app.use(routes());

// app.listen(PORT, () => {
//   console.log(`API server running on port ${PORT}`);
// });

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import paystackRoutes from './routes/paystack.js';

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: [
    'https://74009ab1-2c88-4fc5-a76e-4ac0524cf476.app-preview.com',
    'https://velocitygloballeasing.com',
    'https://new-velocity-global-web.vercel.app', 
    'https://new-velocity-global-web-changach-3000s-projects.vercel.app', 
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// ✅ ORDER MATTERS: Middleware FIRST
app.use(cors(corsOptions));
app.use(express.json());

// ✅ FIXED ROUTING
app.use('/api/paystack', paystackRoutes);  // Paystack routes
app.use('/api', routes());                 // Other routes

console.log('🚀 Server ready - Paystack at /api/paystack/initialize');

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
