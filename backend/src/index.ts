import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { paintingRoutes } from './routes/painting';

const envPath = path.join(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn('Warning: .env.local not found:', result.error.message);
} else {
  console.log('✓ Loaded .env.local successfully');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb' }));

// Routes
app.use('/api/painting', paintingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✨ Painting App Backend running at http://localhost:${PORT}`);
  console.log(`📝 API endpoint: /api/painting`);
});
