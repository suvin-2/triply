import { describe, it, expect } from "vitest";
import { calcSettlement } from "../../src/utils/settlement";
import type { Expense } from "../../src/types";

/** 테스트용 Expense 생성 헬퍼 */
function makeExpense(
  overrides: Partial<Expense> & Pick<Expense, "amount" | "paidBy" | "splitWith">,
): Expense {
  return {
    id: "e1",
    title: "테스트",
    category: "기타",
    createdAt: 0,
    ...overrides,
  };
}

describe("calcSettlement", () => {
  describe("2명 정산", () => {
    it("A가 전부 낸 경우 B → A 로 절반 송금", () => {
      const members = ["A", "B"];
      const expenses = [makeExpense({ amount: 20000, paidBy: "A", splitWith: ["A", "B"] })];

      const { transfers, balance } = calcSettlement(members, expenses);

      expect(transfers).toHaveLength(1);
      expect(transfers[0]).toMatchObject({ from: "B", to: "A", amount: 10000 });
      expect(balance["A"]).toBe(10000);
      expect(balance["B"]).toBe(-10000);
    });

    it("서로 비슷하게 낸 경우 한 번만 정산", () => {
      const members = ["A", "B"];
      const expenses = [
        makeExpense({ id: "e1", amount: 30000, paidBy: "A", splitWith: ["A", "B"] }),
        makeExpense({ id: "e2", amount: 10000, paidBy: "B", splitWith: ["A", "B"] }),
      ];

      const { transfers } = calcSettlement(members, expenses);

      expect(transfers).toHaveLength(1);
      expect(transfers[0]).toMatchObject({ from: "B", to: "A", amount: 10000 });
    });
  });

  describe("3명 정산", () => {
    it("A가 전부 낸 경우 B, C → A 로 각자 1/3씩 송금", () => {
      const members = ["A", "B", "C"];
      // 30000 / 3 = 10000 → 100원 단위 반올림으로 정확히 나뉨
      const expenses = [makeExpense({ amount: 30000, paidBy: "A", splitWith: ["A", "B", "C"] })];

      const { transfers } = calcSettlement(members, expenses);

      expect(transfers).toHaveLength(2);
      transfers.forEach((t) => {
        expect(t.to).toBe("A");
        expect(t.amount).toBe(10000);
      });
    });

    it("최소 송금 횟수 (그리디): 3명이 각자 다른 금액 낸 경우", () => {
      const members = ["A", "B", "C"];
      // A: 60000 냄, B·C와 20000씩 나눔 → A +40000
      // B: 0 냄, A·C에게 20000 + 10000 = -30000
      // C: 30000 냄, B와 10000 나눔 → C +20000... 정확히 계산해보자
      // A pays 60000 split by [A,B,C]: balance A+=40000, B-=20000, C-=20000
      // C pays 30000 split by [B,C]: balance C+=15000, B-=15000
      // after: A=40000, B=-35000, C=-5000 → round to 100
      const expenses = [
        makeExpense({ id: "e1", amount: 60000, paidBy: "A", splitWith: ["A", "B", "C"] }),
        makeExpense({ id: "e2", amount: 30000, paidBy: "C", splitWith: ["B", "C"] }),
      ];

      const { transfers } = calcSettlement(members, expenses);

      // 총 이체 금액은 변하지 않아야 함
      const totalFrom = transfers.reduce((s, t) => s + t.amount, 0);
      expect(totalFrom).toBe(40000); // A가 받아야 하는 총액
    });
  });

  describe("한 명이 전부 낸 경우", () => {
    it("본인 혼자 splitWith에 포함되어 있어도 올바르게 계산", () => {
      const members = ["A", "B", "C"];
      const expenses = [makeExpense({ amount: 90000, paidBy: "A", splitWith: ["A", "B", "C"] })];

      const { balance } = calcSettlement(members, expenses);

      expect(balance["A"]).toBe(60000);
      expect(balance["B"]).toBe(-30000);
      expect(balance["C"]).toBe(-30000);
    });
  });

  describe("splitWith 빈 배열 방어 코드", () => {
    it("splitWith가 빈 배열인 지출은 무시하고 계산", () => {
      const members = ["A", "B"];
      const expenses = [
        makeExpense({ id: "e1", amount: 999999, paidBy: "A", splitWith: [] }), // 무시됨
        makeExpense({ id: "e2", amount: 20000, paidBy: "A", splitWith: ["A", "B"] }),
      ];

      const { transfers } = calcSettlement(members, expenses);

      expect(transfers).toHaveLength(1);
      expect(transfers[0].amount).toBe(10000); // e2만 반영
    });

    it("모든 지출의 splitWith가 비어 있으면 송금 없음", () => {
      const members = ["A", "B"];
      const expenses = [makeExpense({ amount: 50000, paidBy: "A", splitWith: [] })];

      const { transfers, balance } = calcSettlement(members, expenses);

      expect(transfers).toHaveLength(0);
      expect(balance["A"]).toBe(0);
      expect(balance["B"]).toBe(0);
    });
  });

  describe("1원 단위 반올림", () => {
    it("나눗셈 잔액을 1원 단위 정수로 반올림", () => {
      const members = ["A", "B", "C"];
      // 10000 / 3 ≈ 3333.33 → 1원 단위 반올림
      const expenses = [makeExpense({ amount: 10000, paidBy: "A", splitWith: ["A", "B", "C"] })];

      const { balance } = calcSettlement(members, expenses);

      Object.values(balance).forEach((v) => {
        expect(Number.isInteger(v)).toBe(true);
      });
    });

    it("반올림 후 송금 금액도 1원 단위 정수", () => {
      const members = ["A", "B", "C"];
      const expenses = [makeExpense({ amount: 10000, paidBy: "A", splitWith: ["A", "B", "C"] })];

      const { transfers } = calcSettlement(members, expenses);

      transfers.forEach((t) => {
        expect(Number.isInteger(t.amount)).toBe(true);
      });
    });
  });

  describe("재현 케이스: 3으로 나누어지지 않는 금액", () => {
    it("지우/수빈/손지 시나리오 — 100원 손실 없이 1원 단위 정산", () => {
      const members = ["지우", "수빈", "손지"];
      const expenses = [
        makeExpense({ id: "e1", amount: 45000, paidBy: "지우", splitWith: ["지우", "수빈"] }),
        makeExpense({
          id: "e2",
          amount: 24000,
          paidBy: "지우",
          splitWith: ["지우", "수빈", "손지"],
        }),
        makeExpense({
          id: "e3",
          amount: 50000,
          paidBy: "수빈",
          splitWith: ["지우", "수빈", "손지"],
        }),
      ];

      const { transfers, balance } = calcSettlement(members, expenses);

      // 지우: 낸 돈 69000, 부담 47167 → +21833
      // 수빈: 낸 돈 50000, 부담 47167 → +2833
      // 손지: 낸 돈 0, 부담 24667 → -24667
      expect(balance["지우"]).toBeGreaterThan(20000);
      expect(balance["수빈"]).toBeGreaterThan(0);
      expect(balance["손지"]).toBeLessThan(0);

      // 손지가 보내는 총액은 손지 부담금과 1원 이내 오차
      const fromSonji = transfers
        .filter((t) => t.from === "손지")
        .reduce((s, t) => s + t.amount, 0);
      expect(Math.abs(fromSonji - Math.abs(balance["손지"]))).toBeLessThanOrEqual(1);

      // 잔액은 모두 1원 단위 정수
      Object.values(balance).forEach((v) => {
        expect(Number.isInteger(v)).toBe(true);
      });
    });
  });

  describe("정산 불필요한 케이스", () => {
    it("지출이 없으면 송금 없음", () => {
      const { transfers } = calcSettlement(["A", "B"], []);
      expect(transfers).toHaveLength(0);
    });

    it("각자 정확히 자기 몫만 낸 경우 송금 없음", () => {
      const members = ["A", "B"];
      const expenses = [
        makeExpense({ id: "e1", amount: 10000, paidBy: "A", splitWith: ["A"] }),
        makeExpense({ id: "e2", amount: 10000, paidBy: "B", splitWith: ["B"] }),
      ];

      const { transfers } = calcSettlement(members, expenses);
      expect(transfers).toHaveLength(0);
    });
  });
});
