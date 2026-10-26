export interface LoanForSummary {
  amount: number | string;
  due_date: string | Date;
  repaid_at: string | Date | null;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  outstandingAmount: number;
  currency: 'INR';
}

export function calculateSummary(loans: LoanForSummary[], today = new Date().toISOString().slice(0, 10)): LoanSummary {
  const totalLent = loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
  const repaid = loans.filter((loan) => loan.repaid_at !== null);
  const unpaid = loans.filter((loan) => loan.repaid_at === null);
  const totalRepaid = repaid.reduce((sum, loan) => sum + Number(loan.amount), 0);
  const overdueAmount = unpaid.reduce((sum, loan) => {
    const due = loan.due_date instanceof Date
      ? loan.due_date.toISOString().slice(0, 10)
      : String(loan.due_date).slice(0, 10);
    return sum + (due < today ? Number(loan.amount) : 0);
  }, 0);
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  return {
    totalLent: round(totalLent),
    totalRepaid: round(totalRepaid),
    overdueAmount: round(overdueAmount),
    outstandingAmount: round(unpaid.reduce((sum, loan) => sum + Number(loan.amount), 0)),
    currency: 'INR',
  };
}
