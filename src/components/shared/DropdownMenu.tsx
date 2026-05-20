import { useState, useRef, useEffect } from "react";
import s from "./DropdownMenu.module.scss";

export interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

/**
 * 점 3개 케밥 메뉴 버튼 + 드롭다운.
 * 외부 클릭 감지 및 상태 관리를 내부에서 처리한다.
 * items가 비어있으면 레이아웃 공간은 유지하되 버튼을 숨긴다.
 */
export function DropdownMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const empty = items.length === 0;

  return (
    <div
      className={s.wrap}
      ref={wrapRef}
      style={empty ? { visibility: "hidden", pointerEvents: "none" } : undefined}
    >
      <button
        className={s.btn}
        aria-label="메뉴"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="4" cy="10" r="1.5" fill="#0A0A0A" />
          <circle cx="10" cy="10" r="1.5" fill="#0A0A0A" />
          <circle cx="16" cy="10" r="1.5" fill="#0A0A0A" />
        </svg>
      </button>
      {open && !empty && (
        <div className={s.dropdown}>
          {items.map((item, i) => (
            <button
              key={i}
              className={`${s.item} ${item.danger ? s.itemDanger : ""}`}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
