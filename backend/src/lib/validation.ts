import { z } from 'zod';

export const phoneSchema = z.string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number with 10–15 digits.');

export const requestOtpSchema = z.object({ phone: phoneSchema });
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must contain six digits.'),
});

export const createLoanSchema = z.object({
  friendName: z.string().trim().min(1).max(80),
  amount: z.coerce.number().finite().positive().max(9999999999.99),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD.'),
}).superRefine((value, ctx) => {
  const date = new Date(`${value.dueDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.dueDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dueDate'], message: 'Enter a real calendar date.' });
  }
});
