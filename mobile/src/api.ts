const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000').replace(/\/$/, '');

export type Loan = {
  id: string | number;
  friendName: string;
  amount: number;
  dueDate: string;
  repaidAt: string | null;
  createdAt?: string;
};

export type Summary = {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  outstandingAmount: number;
  currency: 'INR';
};

async function request<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body as T;
}

export const api = {
  requestOtp: (phone: string) => request<{ message: string }>('/api/auth/request-otp', undefined, {
    method: 'POST', body: JSON.stringify({ phone }),
  }),
  verifyOtp: (phone: string, otp: string) => request<{ token: string; user: { id: string; phone: string } }>('/api/auth/verify-otp', undefined, {
    method: 'POST', body: JSON.stringify({ phone, otp }),
  }),
  getLoans: (token: string) => request<{ loans: Loan[] }>('/api/loans', token),
  createLoan: (token: string, loan: { friendName: string; amount: number; dueDate: string }) =>
    request<{ loan: Loan }>('/api/loans', token, { method: 'POST', body: JSON.stringify(loan) }),
  repayLoan: (token: string, id: string | number) =>
    request<{ loan: Loan }>(`/api/loans/${id}/repay`, token, { method: 'PATCH' }),
  getSummary: (token: string) => request<Summary>('/api/summary', token),
};
