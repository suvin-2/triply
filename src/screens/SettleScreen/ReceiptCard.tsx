import { forwardRef } from 'react';
import { fmt } from '../../utils/format';
import { formatDateLabel } from '../../utils/formatDate';
import type { RoomWithExpenses, Transfer } from '../../types';
import s from './ReceiptCard.module.scss';

interface Props {
  room: RoomWithExpenses;
  transfers: Transfer[];
  total: number;
}

/**
 * 영수증 스타일 공유 카드.
 * html2canvas 캡처 대상이므로 forwardRef로 DOM ref를 외부에 노출한다.
 */
const ReceiptCard = forwardRef<HTMLDivElement, Props>(({ room, transfers, total }, ref) => {
  const barWidths = [2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3,
                     2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1];

  return (
    <div ref={ref} className={s.card}>
      {/* 상단 톱니 — 반복 원형으로 절취선 표현 */}
      <div className={s.serratedTop} />

      <div className={s.body}>
        {/* 헤더 */}
        <div className={s.header}>
          <div className={`mono ${s.brand}`}>TRIPLY</div>
          <div className={`mono ${s.dateLabel}`}>
            {formatDateLabel(room.startDate, room.endDate)}
          </div>
        </div>

        {/* 여행 이름 + 멤버 */}
        <div className={s.tripTitle}>{room.name}</div>
        <div className={`mono ${s.memberLine}`}>{room.members.join(' · ')}</div>

        <div className={s.divider} />

        {/* 지출 항목 테이블 */}
        <div className={`mono ${s.sectionLabel}`}>EXPENSES</div>
        <div className={s.itemList}>
          {room.expenses.map((e) => (
            <div key={e.id} className={s.itemRow}>
              <div className={s.itemLeft}>
                <span className={s.itemTitle}>{e.title}</span>
                <span className={`mono ${s.itemPayer}`}>{e.paidBy}</span>
              </div>
              <span className={`mono ${s.itemAmount}`}>{fmt(e.amount)}</span>
            </div>
          ))}
        </div>

        <div className={s.divider} />

        {/* 합계 */}
        <div className={s.totalRow}>
          <span className={`mono ${s.totalLabel}`}>TOTAL</span>
          <span className={`mono ${s.totalAmount}`}>{fmt(total)}</span>
        </div>

        {transfers.length > 0 && (
          <>
            <div className={s.dividerDash} />
            {/* 정산 내역 */}
            <div className={`mono ${s.sectionLabel}`}>SETTLEMENT</div>
            {transfers.map((t, i) => (
              <div key={i} className={s.settleRow}>
                <span className={s.settleName}>{t.from} → {t.to}</span>
                <span className={`mono ${s.settleAmount}`}>{fmt(t.amount)}</span>
              </div>
            ))}
          </>
        )}

        {/* 바코드 */}
        <div className={s.barcodeWrap}>
          <div className={s.barcode}>
            {barWidths.map((w, i) => (
              <div key={i} className={s.bar} style={{ width: w }} />
            ))}
          </div>
          <div className={`mono ${s.barcodeNum}`}>
            TRIPLY · {room.id.toUpperCase().slice(0, 8)}
          </div>
        </div>
      </div>

      {/* 하단 톱니 */}
      <div className={s.serratedBottom} />
    </div>
  );
});

ReceiptCard.displayName = 'ReceiptCard';
export default ReceiptCard;
