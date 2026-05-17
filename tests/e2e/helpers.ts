const DB_URL = 'https://triply-22680-default-rtdb.firebaseio.com';

export interface TestRoomData {
  name: string;
  members: string[];
  status?: 'active' | 'done';
  startDate?: string;
  endDate?: string;
}

export interface TestExpense {
  title: string;
  amount: number;
  paidBy: string;
  splitWith: string[];
  category: string;
}

export async function createTestRoom(data: TestRoomData): Promise<string> {
  const res = await fetch(`${DB_URL}/rooms.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      members: data.members,
      status: data.status ?? 'active',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      createdAt: Date.now(),
    }),
  });
  const result = (await res.json()) as { name: string };
  return result.name;
}

export async function addExpenseToRoom(
  roomId: string,
  expense: TestExpense,
): Promise<string> {
  const res = await fetch(`${DB_URL}/rooms/${roomId}/expenses.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...expense, createdAt: Date.now() }),
  });
  const result = (await res.json()) as { name: string };
  return result.name;
}

export async function setRoomStatus(roomId: string, status: 'active' | 'done'): Promise<void> {
  await fetch(`${DB_URL}/rooms/${roomId}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export async function deleteTestRoom(roomId: string): Promise<void> {
  await fetch(`${DB_URL}/rooms/${roomId}.json`, { method: 'DELETE' });
}
