import { Router } from 'express';
import { pool } from '../db/pool';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { createLoanSchema } from '../lib/validation';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, friend_name AS "friendName", amount::float8 AS amount,
              TO_CHAR(due_date, 'YYYY-MM-DD') AS "dueDate",
              repaid_at AS "repaidAt", created_at AS "createdAt"
       FROM loans WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId],
    );
    return res.json({ loans: result.rows });
  } catch (error) { return next(error); }
});

router.post('/', async (req: AuthRequest, res, next) => {
  const parsed = createLoanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid loan.' });
  try {
    const { friendName, amount, dueDate } = parsed.data;
    const result = await pool.query(
      `INSERT INTO loans(user_id, friend_name, amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, friend_name AS "friendName", amount::float8 AS amount,
                 TO_CHAR(due_date, 'YYYY-MM-DD') AS "dueDate",
                 repaid_at AS "repaidAt", created_at AS "createdAt"`,
      [req.userId, friendName, amount, dueDate],
    );
    return res.status(201).json({ loan: result.rows[0] });
  } catch (error) { return next(error); }
});

router.patch('/:id/repay', async (req: AuthRequest, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid loan ID.' });
  try {
    const result = await pool.query(
      `UPDATE loans SET repaid_at = NOW()
       WHERE id = $1 AND user_id = $2 AND repaid_at IS NULL
       RETURNING id, friend_name AS "friendName", amount::float8 AS amount,
                 TO_CHAR(due_date, 'YYYY-MM-DD') AS "dueDate",
                 repaid_at AS "repaidAt", created_at AS "createdAt"`,
      [id, req.userId],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Unpaid loan not found.' });
    return res.json({ loan: result.rows[0] });
  } catch (error) { return next(error); }
});

export default router;
