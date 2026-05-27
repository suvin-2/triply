import { useCallback, useEffect, useRef, useState } from "react";
import { fmt } from "../../utils/format";
import s from "./PaymentSheet.module.scss";

interface Props {
  transfer: { from: string; to: string; amount: number } | null;
  onToss: (amount: number) => void;
  onKakaoPay: () => void;
  onClose: () => void;
}

/**
 * 5본 — 정산 송금 수단 선택 바텀시트.
 * transferRow 탭 시 올라오며, 토스/카카오페이 딥링크를 제공한다.
 * transfer prop이 null이면 언마운트된다.
 * 열릴 때 토스 버튼에 포커스가 이동하며, ESC 키로 닫힌다.
 */
export default function PaymentSheet({ transfer, onToss, onKakaoPay, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const touchStartY = useRef(0);
  const tossButtonRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 320); // 슬라이드아웃 애니메이션 대기 후 언마운트
  }, [onClose]);

  // 마운트 후 트랜지션 트리거 + 포커스 이동
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      tossButtonRef.current?.focus({ preventScroll: true });
    }, 10);
    return () => clearTimeout(t);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  if (!transfer) return null;

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 60) handleClose();
  }

  // 딥링크를 먼저 실행하고 50ms 후 시트를 닫는다.
  // postMessage / window.location.href 가 JS 큐에 쌓인 뒤 상태 변경이 일어나도록 순서를 보장.
  function handleToss() {
    onToss(transfer!.amount);
    setTimeout(handleClose, 50);
  }

  function handleKakaoPay() {
    onKakaoPay();
    setTimeout(handleClose, 50);
  }

  return (
    <div
      className={`${s.overlay} ${visible ? s.visible : ""}`}
      role="button"
      tabIndex={-1}
      onClick={handleClose}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
    >
      <div
        className={`${s.sheet} ${visible ? s.visible : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="송금 수단 선택"
      >
        {/* 스와이프·클릭 버블 차단을 role 없는 div에 위임 */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={s.handle}>
            <div className={s.handleBar} />
          </div>

          <div className={s.sheetContent}>
            <p className={s.label}>정산 대상</p>
            <p className={s.parties}>
              {transfer.from} → {transfer.to}
            </p>
            <p className={s.label}>송금 금액</p>
            <p className={`mono ${s.amount}`}>{fmt(transfer.amount)}원</p>
          </div>

          <div className={s.sheetActions}>
            <button ref={tossButtonRef} className={s.tossBtn} onClick={handleToss}>
              토스 송금하기
            </button>
            <button className={s.kakaoBtn} onClick={handleKakaoPay}>
              카카오페이 송금하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
