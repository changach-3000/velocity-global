import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Task 1: Comprehensive PocketBase connection debugging
const pbUrl = process.env.POCKETBASE_URL;
console.log(`[PocketBase] URL: ${pbUrl || 'UNDEFINED'}`);

if (!pbUrl) {
  console.warn('[PocketBase] WARNING: POCKETBASE_URL is not defined in .env file');
} else {
  console.log('[PocketBase] Attempting connection...');
  console.log(`[PocketBase] Connection status: pending (will be tested on first request)`);
}

app.use(cors());
app.use(express.json());
app.use(routes());

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});