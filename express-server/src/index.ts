import express, { Request, Response } from 'express';
import agentRouter from './agentRouter';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript Express!');
});

app.use('/agents', agentRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
