import { query } from '../db';

export interface Loan {
  id: string;
  friendName: string;
  amount: number;
  dueDate: string;
  repaid: boolean;
  repaidAt: Date | null;
  receiptUrl: string | null;
  createdAt: Date;
  isOverdue: boolean;
}

interface LoanRow extends Record<string, unknown> {
  id: string;
  friend_name: string;
  amount: string;
  due_date: string;
  repaid: boolean;
  repaid_at: Date | null;
  receipt_url: string | null;
  created_at: Date;
  is_overdue: boolean;
}

function mapLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    friendName: row.friend_name,
    amount: Number(row.amount),
    dueDate: row.due_date,
    repaid: row.repaid,
    repaidAt: row.repaid_at ? new Date(row.repaid_at) : null,
    receiptUrl: row.receipt_url ?? null,
    createdAt: new Date(row.created_at),
    isOverdue: Boolean(row.is_overdue),
  };
}

export async function createLoan(
  userId: string,
  input: {
    friendName: string;
    amount: number;
    dueDate: string;
    receiptUrl?: string | null;
  }
): Promise<Loan> {
  const result = await query<LoanRow>(
    `INSERT INTO loans (user_id, friend_name, amount, due_date, receipt_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING
       id,
       friend_name,
       amount,
       due_date,
       repaid,
       repaid_at,
       receipt_url,
       created_at,
       (not repaid and due_date < (now() at time zone 'Asia/Kolkata')::date) as is_overdue`,
    [
      userId,
      input.friendName,
      input.amount,
      input.dueDate,
      input.receiptUrl ?? null,
    ]
  );

  return mapLoan(result.rows[0]);
}

export async function listLoans(userId: string): Promise<Loan[]> {
  const result = await query<LoanRow>(
    `SELECT
       id,
       friend_name,
       amount,
       due_date,
       repaid,
       repaid_at,
       receipt_url,
       created_at,
       (not repaid and due_date < (now() at time zone 'Asia/Kolkata')::date) as is_overdue
     FROM loans
     WHERE user_id = $1
     ORDER BY repaid ASC, due_date ASC`,
    [userId]
  );

  return result.rows.map(mapLoan);
}

export async function markRepaid(
  userId: string,
  loanId: string,
  repaid: boolean
): Promise<Loan | null> {
  const result = await query<LoanRow>(
    `UPDATE loans
     SET repaid = $3::boolean,
         repaid_at = CASE WHEN $3::boolean THEN now() ELSE null END
     WHERE id = $1 AND user_id = $2
     RETURNING
       id,
       friend_name,
       amount,
       due_date,
       repaid,
       repaid_at,
       receipt_url,
       created_at,
       (not repaid and due_date < (now() at time zone 'Asia/Kolkata')::date) as is_overdue`,
    [loanId, userId, repaid]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapLoan(result.rows[0]);
}

export async function getSummary(
  userId: string
): Promise<{ totalLent: number; totalRepaid: number; overdueAmount: number }> {
  const result = await query<{
    total_lent: string | number;
    total_repaid: string | number;
    overdue_amount: string | number;
  }>(
    `SELECT
       coalesce(sum(amount), 0) as total_lent,
       coalesce(sum(amount) filter (where repaid), 0) as total_repaid,
       coalesce(sum(amount) filter (where not repaid and due_date < (now() at time zone 'Asia/Kolkata')::date), 0) as overdue_amount
     FROM loans
     WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];
  return {
    totalLent: Number(row.total_lent),
    totalRepaid: Number(row.total_repaid),
    overdueAmount: Number(row.overdue_amount),
  };
}
