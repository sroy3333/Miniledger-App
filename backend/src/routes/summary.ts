import { Router } from 'express';
import { pool } from '../db/pool';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { calculateSummary } from '../lib/summary';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query(
      `SELECT amount, due_date, repaid_at FROM loans WHERE user_id = $1`,
      [req.userId],
    );
    return res.json(calculateSummary(result.rows));
  } catch (error) { return next(error); }
});

export default router;
