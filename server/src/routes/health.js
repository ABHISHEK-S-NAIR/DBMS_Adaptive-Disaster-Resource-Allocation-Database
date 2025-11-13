import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const dbStatus = await query('SELECT NOW() AS timestamp');
  res.json({
    status: 'ok',
    database: 'connected',
    timestamp: dbStatus.rows[0].timestamp,
  });
});

export default router;
