// router for agent endpoints
import express, { Request, Response } from 'express';

const router = express.Router();

// Example endpoint
router.get('/status', (req: Request, res: Response) => {
  res.json({ status: 'Agent router is running' });
});

export default router;