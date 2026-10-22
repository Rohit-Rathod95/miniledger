export interface Loan {
  id: string;
  friendName: string;
  amount: number;
  dueDate: string;
  repaid: boolean;
  repaidAt: string | null;
  receiptUrl: string | null;
  createdAt: string;
  isOverdue: boolean;
}

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
}

export type RootStackParamList = {
  Home: undefined;
  Add: undefined;
};

