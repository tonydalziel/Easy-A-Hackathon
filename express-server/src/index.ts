import express, { Request, Response } from 'express';
import agentRouter from './agentRouter';

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const port = process.env.PORT || 3000;

// CORS middleware - allow requests from frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins (or specify your frontend URL)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS preflight: ${req.method} ${req.path}`);
    return res.sendStatus(200);
  }
  
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript Express!');
});

app.use('/agents', agentRouter);

const server = app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`✅ Server is listening and ready to accept requests`);
});

server.on('error', (error) => {
  console.error('💥 Server error:', error);
  process.exit(1);
});

console.log('🚀 Starting server...');
