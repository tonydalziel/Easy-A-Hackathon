// router for agent endpoints
import express, { Request, Response } from 'express';

const router = express.Router();

// Example endpoint
router.get('/status', (req: Request, res: Response) => {
  res.json({ status: 'Agent router is running' });
});

router.post('/', (req: Request, res: Response) => {
  // Agent atm consists of provider_id, model_id, prompt
  
  const { provider_id, model_id, prompt } = req.body;
  res.json({ message: 'Agent created successfully' });
});

export default router;