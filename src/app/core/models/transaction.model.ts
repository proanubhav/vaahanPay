export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  vehicle: string;
  customer: string;
  amount: number;
  status: TransactionStatus;
  date: string;
}
