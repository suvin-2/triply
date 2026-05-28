import { fmt } from "../../utils/format";
import s from "./MemberBalanceSection.module.scss";

interface Props {
  members: string[];
  balance: Record<string, number>;
}

/**
 * 송금 내역 탭 상단에 표시되는 멤버별 정산 요약 섹션.
 * 각 멤버의 순 잔액(낸 돈 - 부담액)을 바탕으로 돌려받을 금액 또는 보내야 할 금액을 표시한다.
 */
export default function MemberBalanceSection({ members, balance }: Props) {
  return (
    <div className={s.section}>
      <p className={s.label}>멤버별 정산</p>
      {members.map((member) => {
        const bal = balance[member] ?? 0;
        const sign = bal > 0 ? "+" : bal < 0 ? "-" : "";
        const amountStr = `${sign}${fmt(Math.abs(bal))}원`;
        const subText =
          bal > 0 ? "낸 돈이 더 많아요" : bal < 0 ? "아직 보낼 돈이 있어요" : "딱 맞게 냈어요";
        const amtLabel = bal > 0 ? "돌려받아요" : bal < 0 ? "보내야 해요" : "정산 완료";

        return (
          <div key={member} className={s.card}>
            <div className={s.avatar}>{member[0]}</div>
            <div className={s.info}>
              <span className={s.name}>{member}</span>
              <span className={s.sub}>{subText}</span>
            </div>
            <div className={s.right}>
              <span
                className={`${s.amount} ${bal > 0 ? s.positive : bal < 0 ? s.negative : s.zero}`}
              >
                {amountStr}
              </span>
              <span className={s.amtLabel}>{amtLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
