import type { Expense, Transfer } from "../types";

/**
 * 여행 멤버들의 지출 내역을 바탕으로 최소 송금 횟수를 계산한다.
 * Greedy 알고리즘: 가장 많이 받을 사람과 가장 많이 보낼 사람을 매칭하여 반복 정산.
 *
 * @param members - 여행 참여자 이름 목록
 * @param expenses - 지출 내역 목록
 * @returns transfers(송금 목록)와 balance(각자 잔액)
 */
export function calcSettlement(
  members: string[],
  expenses: Expense[],
): { transfers: Transfer[]; balance: Record<string, number> } {
  const balance: Record<string, number> = {};
  members.forEach((m) => (balance[m] = 0));

  expenses.forEach((e) => {
    // splitWith가 비어 있으면 나눗셈 오류(Infinity) 발생하므로 건너뜀
    if (e.splitWith.length === 0) return;

    balance[e.paidBy] = (balance[e.paidBy] ?? 0) + e.amount;
    const share = e.amount / e.splitWith.length;
    e.splitWith.forEach((p) => {
      balance[p] = (balance[p] ?? 0) - share;
    });
  });

  // 소수점 부동소수점 오차(n/3 등) 제거 — 1원 단위로 반올림
  Object.keys(balance).forEach((k) => {
    balance[k] = Math.round(balance[k]);
  });

  const creditors: { name: string; amount: number }[] = [];
  const debtors: { name: string; amount: number }[] = [];

  Object.entries(balance).forEach(([name, bal]) => {
    if (bal > 0) creditors.push({ name, amount: bal });
    else if (bal < 0) debtors.push({ name, amount: -bal });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0) {
      transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }

  return { transfers, balance };
}
