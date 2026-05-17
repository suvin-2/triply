export type ExpenseCategory = '식사' | '교통' | '숙소' | '관광' | '기타';
export type RoomStatus = 'active' | 'done';

export const CATEGORIES: ExpenseCategory[] = ['식사', '교통', '숙소', '관광', '기타'];

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  splitWith: string[];
  category: ExpenseCategory;
  createdAt: number;
}

// 홈 화면용 — expenses 미포함
export interface Room {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  members: string[];
  status: RoomStatus;
  createdAt: number;
  ownerToken?: string;
}

// TripScreen / SettleScreen용
export interface RoomWithExpenses extends Room {
  expenses: Expense[];
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}
