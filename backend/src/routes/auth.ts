import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { requestOtpSchema, verifyOtpSchema } from '../lib/validation';

const router = Router();
const challenges = new Map<string, { otp: string; expiresAt: number }>();
const ttlMs = Math.max(1, Number(process.env.OTP_TTL_MINUTES || 5)) * 60_000;

router.post('/request-otp', (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid phone number.' });

  const phone = parsed.data.phone.startsWith('+') ? parsed.data.phone : `+${parsed.data.phone}`;
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  challenges.set(phone, { otp, expiresAt: Date.now() + ttlMs });
  console.log(`MiniLedger demo OTP for ${phone}: ${otp}`);
  return res.json({ message: 'Demo OTP generated. Check the backend terminal.', expiresInSeconds: Math.floor(ttlMs / 1000) });
});

router.post('/verify-otp', async (req, res, next) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input.' });

  const phone = parsed.data.phone.startsWith('+') ? parsed.data.phone : `+${parsed.data.phone}`;
  const challenge = challenges.get(phone);
  if (!challenge || challenge.expiresAt < Date.now() || challenge.otp !== parsed.data.otp) {
    return res.status(401).json({ error: 'Incorrect or expired OTP. Request a new code and try again.' });
  }
  challenges.delete(phone);

  try {
    const result = await pool.query(
      `INSERT INTO users(phone) VALUES ($1)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, phone`,
      [phone],
    );
    const user = result.rows[0] as { id: string; phone: string };
    const token = jwt.sign({}, process.env.JWT_SECRET || 'local-only-insecure-secret', {
      subject: String(user.id), expiresIn: '7d',
    });
    return res.json({ token, user: { id: user.id, phone: user.phone } });
  } catch (error) {
    return next(error);
  }
});

export default router;
