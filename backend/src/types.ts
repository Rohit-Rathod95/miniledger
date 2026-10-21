// User entity mirroring the `users` table
export interface User {
  id: string;
  phone: string;
  created_at: Date;
}

// OTP code entity mirroring the `otp_codes` table
export interface OtpCode {
  id: string;
  phone: string;
  code: string;
  expires_at: Date;
  consumed: boolean;
  created_at: Date;
}

// Loan entity mirroring the `loans` table
export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  // pg returns numeric as string
  amount: string;
  // format YYYY-MM-DD
  due_date: string;
  repaid: boolean;
  repaid_at: Date | null;
  receipt_url: string | null;
  created_at: Date;
}

// Summary of loan metrics for a user
export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
}
