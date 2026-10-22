import { apiFetch } from './client';
import { Loan, Summary } from '../types';

export interface CreateLoanInput {
  friendName: string;
  amount: number;
  dueDate: string;
  receiptUrl?: string | null;
}

export async function listLoans(): Promise<Loan[]> {
  return apiFetch<Loan[]>('/loans');
}

export async function createLoan(input: CreateLoanInput): Promise<Loan> {
  return apiFetch<Loan>('/loans', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function markRepaid(id: string, repaid: boolean = true): Promise<Loan> {
  return apiFetch<Loan>(`/loans/${id}/repaid`, {
    method: 'PATCH',
    body: JSON.stringify({ repaid }),
  });
}

export async function getSummary(): Promise<Summary> {
  return apiFetch<Summary>('/summary');
}
