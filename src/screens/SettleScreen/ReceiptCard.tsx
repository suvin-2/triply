import { forwardRef } from "react";
import { fmt } from "../../utils/format";
import { formatDateLabel } from "../../utils/formatDate";
import type { RoomWithExpenses, Transfer } from "../../types";
import s from "./ReceiptCard.module.scss";

const CARD_BG = "#FBF8F1";
const MAX_EXPENSES = 10;

/**
 * room.id를 seed로 결정론적 바코드 패턴을 생성한다.
 * 같은 방은 항상 같은 바코드 모양을 갖는다.
 */
function barcodePattern(seed: string): Array<{ w: number; fill: boolean }> {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: Array<{ w: number; fill: boolean }> = [];
  for (let i = 0; i < 56; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push({ w: 1 + (h % 4), fill: ((h >>> 4) & 1) === 1 });
  }
  return bars;
}

/** room.id 해시 기반 4자리 주문 번호 */
function toOrderNo(id: string): string {
  const n = Math.abs(
    id.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0),
  );
  return String(n % 9999).padStart(4, "0");
}

/** 영수증 상단/하단 지그재그 가장자리 SVG */
function SerratedEdge({ flip = false }: { flip?: boolean }) {
  const teeth = 24;
  const w = 100 / teeth;
  let d = `M0,${flip ? 0 : 8} `;
  for (let i = 0; i < teeth; i++) {
    const x1 = i * w;
    const x2 = x1 + w / 2;
    const x3 = x1 + w;
    d += flip ? `L${x2},8 L${x3},0 ` : `L${x2},0 L${x3},8 `;
  }
  d += flip ? "L100,0 L0,0 Z" : "L100,8 L0,8 Z";
  return (
    <svg
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      style={{
        width: "100%",
        height: 12,
        display: "block",
        transform: flip ? "translateY(-1px)" : "translateY(1px)",
      }}
    >
      <path d={d} fill={CARD_BG} />
    </svg>
  );
}

interface Props {
  room: RoomWithExpenses;
  transfers: Transfer[];
  total: number;
}

/**
 * 영수증 스타일 공유 카드.
 * html2canvas 캡처 대상이므로 forwardRef로 DOM ref를 외부에 노출한다.
 */
const ReceiptCard = forwardRef<HTMLDivElement, Props>(
  ({ room, transfers, total }, ref) => {
    const no = toOrderNo(room.id);
    const bars = barcodePattern(room.id);
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-CA").replace(/-/g, ".");
    const perPerson = room.members.length > 0 ? total / room.members.length : 0;
    const displayedExpenses = room.expenses.slice(0, MAX_EXPENSES);
    const overflowCount = room.expenses.length - MAX_EXPENSES;

    return (
      <div ref={ref} style={{ position: "relative" }}>
        <SerratedEdge flip={false} />

        <div className={s.card}>
          <div className={s.body}>
            {/* 브랜드 */}
            <div className={s.brandWrap}>
              <div className={s.brandBox}>
                <span className={s.brandDot} />
                <span className={s.brandText}>TRIPLY</span>
              </div>
              <div className={s.receiptLabel}>
                ★ ★ ★&nbsp;&nbsp;TRIP RECEIPT&nbsp;&nbsp;★ ★ ★
              </div>
            </div>

            {/* 여행 이름 + 날짜 */}
            <div className={s.tripWrap}>
              <div className={s.tripTitle}>{room.name}</div>
              <div className={s.tripDate}>
                {formatDateLabel(room.startDate, room.endDate).toUpperCase()}
              </div>
            </div>

            {/* ORDER # / PARTY OF / SERVED BY */}
            <div className={s.orderBlock}>
              <div className={s.orderRow}>
                <span>ORDER #{no}</span>
                <span>{dateStr}</span>
              </div>
              <div className={s.orderRow}>
                <span>PARTY OF</span>
                <span>{room.members.length}</span>
              </div>
              <div className={s.orderRow}>
                <span>SERVED BY</span>
                <span>TRIPLY ✦</span>
              </div>
            </div>

            {/* QTY / ITEM / AMOUNT 그리드 */}
            <div className={s.itemBlock}>
              <div className={s.itemHeader}>
                <span>NO</span>
                <span>ITEM</span>
                <span className={s.right}>AMOUNT</span>
              </div>
              {displayedExpenses.map((e, i) => (
                <div key={e.id} className={s.itemRow}>
                  <span className={s.itemQty}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className={s.itemInfo}>
                    <div className={s.itemTitle}>{e.title.toUpperCase()}</div>
                    <div className={s.itemSub}>
                      BY {e.paidBy.toUpperCase()} · {e.splitWith.length}P
                    </div>
                  </div>
                  <span className={`${s.right} ${s.itemAmount}`}>
                    {fmt(e.amount)}
                  </span>
                </div>
              ))}
              {overflowCount > 0 && (
                <div className={s.overflowRow}>
                  <span />
                  <span className={s.overflowText}>+ {overflowCount}건 더</span>
                  <span />
                </div>
              )}
            </div>

            {/* SUBTOTAL / TAX / TOTAL / PER PERSON */}
            <div className={s.totalBlock}>
              <div className={s.totalRow}>
                <span className={s.totalLabel}>ITEM COUNT</span>
                <span className={s.totalValue}>
                  {String(room.expenses.length).padStart(2, "0")}
                </span>
              </div>
              <div className={s.totalRow}>
                <span className={s.totalLabel}>SUBTOTAL</span>
                <span className={s.totalValue}>{fmt(total)}</span>
              </div>
              <div className={s.totalRow}>
                <span className={s.totalLabel}>TAX</span>
                <span className={s.totalValue}>0</span>
              </div>
              <div className={s.grandTotalRow}>
                <span className={s.grandTotalLabel}>TOTAL</span>
                <span className={s.grandTotalAmount}>₩{fmt(total)}</span>
              </div>
              <div className={s.perPersonRow}>
                <span>PER PERSON</span>
                <span>₩{fmt(perPerson)}</span>
              </div>
            </div>

            {/* ✦ SETTLEMENT TRANSFERS ✦ */}
            <div className={s.settleBlock}>
              <div className={s.settleHeader}>✦ SETTLEMENT TRANSFERS ✦</div>
              {transfers.length === 0 ? (
                <div className={s.settleEmpty}>
                  ALL EVEN — NO TRANSFERS NEEDED
                </div>
              ) : (
                transfers.map((t, i) => (
                  <div key={i} className={s.settleRow}>
                    <span>
                      <span className={s.settleName}>{t.from}</span>
                      <span className={s.settleArrow}>→</span>
                      <span className={s.settleName}>{t.to}</span>
                    </span>
                    <span className={s.settleAmount}>{fmt(t.amount)}</span>
                  </div>
                ))
              )}
            </div>

            {/* AUTH / METHOD / STATUS */}
            <div className={s.authBlock}>
              <div>
                AUTH ........ {no}-
                {String(today.getMonth() + 1).padStart(2, "0")}
                {String(today.getDate()).padStart(2, "0")}
              </div>
              <div>METHOD ...... TOSS · KAKAOPAY · CASH</div>
              <div>
                STATUS ...... <span className={s.statusChip}>SETTLED</span>
              </div>
            </div>

            {/* THANK YOU */}
            <div className={s.thankYou}>
              ━━━━━ THANK YOU ━━━━━
              <br />
              <span className={s.thankYouSub}>FOR A GREAT TRIP</span>
            </div>

            {/* 바코드 */}
            <div className={s.barcodeWrap}>
              <div className={s.barcode}>
                {bars.map((b, i) => (
                  <div
                    key={i}
                    className={s.bar}
                    style={{
                      width: b.w,
                      background: b.fill ? "#0A0A0A" : "transparent",
                    }}
                  />
                ))}
              </div>
              <div className={s.barcodeNum}>TRIPLY-{no}</div>
            </div>
          </div>
        </div>

        <SerratedEdge flip={true} />
      </div>
    );
  },
);

ReceiptCard.displayName = "ReceiptCard";
export default ReceiptCard;
