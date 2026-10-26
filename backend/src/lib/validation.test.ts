import { describe, expect, it } from 'vitest';
import { createLoanSchema, phoneSchema } from './validation';
import { calculateSummary } from './summary';

describe('phone validation', () => {
  it('accepts a 10-digit phone number', () => expect(phoneSchema.safeParse('9876543210').success).toBe(true));
  it('rejects short phone numbers', () => expect(phoneSchema.safeParse('12345').success).toBe(false));
});

describe('loan validation', () => {
  it('accepts a valid loan', () => {
    expect(createLoanSchema.safeParse({ friendName: 'Aarav', amount: 100, dueDate: '2026-11-30' }).success).toBe(true);
  });
  it('rejects zero amounts and invalid dates', () => {
    expect(createLoanSchema.safeParse({ friendName: 'Aarav', amount: 0, dueDate: '2026-11-30' }).success).toBe(false);
    expect(createLoanSchema.safeParse({ friendName: 'Aarav', amount: 100, dueDate: '2026-02-30' }).success).toBe(false);
  });
});

describe('summary calculation', () => {
  it('calculates lent, repaid and overdue totals', () => {
    const summary = calculateSummary([
      { amount: '100.00', due_date: '2026-01-01', repaid_at: null },
      { amount: '50.00', due_date: '2026-12-01', repaid_at: null },
      { amount: '25.00', due_date: '2026-01-01', repaid_at: '2026-01-02T00:00:00Z' },
    ], '2026-10-23');
    expect(summary).toEqual({
      totalLent: 175, totalRepaid: 25, overdueAmount: 100, outstandingAmount: 150, currency: 'INR',
    });
  });
});
