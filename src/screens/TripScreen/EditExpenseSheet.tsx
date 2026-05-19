import { useState, useEffect, useRef } from "react";
import { ref, update } from "firebase/database";
import { db } from "../../lib/firebase";
import { Avatar, Caps, Chevron } from "../../components/shared/atoms";
import CharCounter from "../../components/shared/CharCounter";
import { fmt, amountFontSize } from "../../utils/format";
import { CATEGORIES } from "../../types";
import type { Expense, ExpenseCategory, RoomWithExpenses } from "../../types";
import s from "./EditExpenseSheet.module.scss";

interface Props {
  room: RoomWithExpenses;
  expense: Expense;
  onClose: () => void;
  onSaved: () => void;
  onError?: (msg: string) => void;
}

/**
 * 지출 수정 바텀시트.
 * AddExpenseSheet와 동일한 UI를 사용하되 기존 지출 값을 pre-fill하고,
 * 저장 시 Firebase update()를 호출한다. createdAt은 수정하지 않는다.
 */
export default function EditExpenseSheet({
  room,
  expense,
  onClose,
  onSaved,
  onError,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.amount));
  const [paidBy, setPaidBy] = useState(expense.paidBy);
  const [splitWith, setSplitWith] = useState<string[]>([...expense.splitWith]);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(id);
  }, []);

  const MAX_AMOUNT = 10_000_000;

  const numAmount = parseInt(amount || "0", 10) || 0;
  const perPerson = splitWith.length > 0 ? numAmount / splitWith.length : 0;
  const canSave =
    title.trim().length > 0 && numAmount > 0 && splitWith.length > 0;
  const allSelected = splitWith.length === room.members.length;

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") {
      setAmount("");
      return;
    }
    const num = parseInt(raw, 10);
    if (num > MAX_AMOUNT) return;
    setAmount(String(num));
  }

  function toggleParticipant(member: string) {
    setSplitWith((prev) =>
      prev.includes(member)
        ? prev.filter((x) => x !== member)
        : [...prev, member],
    );
  }

  function toggleAll() {
    setSplitWith(allSelected ? [] : [...room.members]);
  }

  function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    // createdAt은 수정하지 않음 — 원본 생성 시각 보존
    const updateRef = update(
      ref(db, `rooms/${room.id}/expenses/${expense.id}`),
      {
        title: title.trim(),
        amount: numAmount,
        paidBy,
        splitWith,
        category,
      },
    );
    onSaved();
    updateRef
      .catch((err) => {
        console.error("[EditExpenseSheet] 지출 수정 실패:", err);
        onError?.("지출 수정에 실패했어요. 다시 시도해주세요.");
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <div
      className={`${s.overlay} ${visible ? s.visible : ""}`}
      onClick={onClose}
    >
      <div
        className={`${s.sheet} ${visible ? s.visible : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className={s.handle}>
          <div className={s.handleBar} />
        </div>

        {/* 시트 헤더 */}
        <div className={s.sheetHeader}>
          <div className={s.sheetTitle}>
            <Caps>EDIT</Caps>
            <span className={s.sheetTitleText}>지출 수정</span>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                d="M2 2L16 16M16 2L2 16"
                stroke="#0A0A0A"
                strokeWidth="1.6"
              />
            </svg>
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className={s.scrollArea}>
          {/* 금액 디스플레이 (탭하면 네이티브 키패드 올라옴) */}
          <div
            className={s.amountBlock}
            onClick={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              className={s.amountInput}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={handleAmountChange}
              aria-label="금액 입력"
            />
            <div
              className={`mono ${s.amountDisplay} ${numAmount === 0 ? s.empty : s.filled}`}
              style={{
                fontSize:
                  numAmount > 0 ? amountFontSize(numAmount, 56) : undefined,
              }}
            >
              {numAmount === 0 ? "0" : fmt(numAmount)}
              <span className={s.amountUnit}>원</span>
            </div>
            {numAmount > 0 && splitWith.length > 0 && (
              <div className={s.perPersonLabel}>
                1인당{" "}
                <span className={s.perPersonAmount}>{fmt(perPerson)}</span>원
              </div>
            )}
          </div>

          {/* 항목명 */}
          <div className={s.fieldSection}>
            <div className={s.fieldLabel}>항목명</div>
            <input
              className={s.titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="저녁 식사, 렌터카, 숙소..."
              maxLength={20}
            />
            <CharCounter current={title.length} max={20} />
          </div>

          {/* 카테고리 */}
          <div className={s.fieldSection}>
            <div className={s.fieldLabel}>카테고리</div>
            <div className={s.chips}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`${s.chip} ${category === cat ? s.active : s.inactive}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 결제한 사람 */}
          <div className={s.fieldSection}>
            <div className={s.fieldLabel}>결제한 사람</div>
            <div className={s.payerList}>
              {room.members.map((member) => (
                <button
                  key={member}
                  className={`${s.payerBtn} ${paidBy === member ? s.active : s.inactive}`}
                  onClick={() => setPaidBy(member)}
                >
                  <Avatar name={member} size={22} dark={paidBy !== member} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {member}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 참여 인원 */}
          <div className={s.fieldSection}>
            <div className={s.participantHeader}>
              <div className={s.fieldLabel} style={{ marginBottom: 0 }}>
                참여 인원 ({splitWith.length}/{room.members.length})
              </div>
              <button className={s.toggleAllBtn} onClick={toggleAll}>
                {allSelected ? "전체 해제" : "전체 선택"}
              </button>
            </div>
            <div className={s.participantGrid}>
              {room.members.map((member) => {
                const on = splitWith.includes(member);
                return (
                  <button
                    key={member}
                    className={`${s.participantBtn} ${on ? s.active : s.inactive}`}
                    onClick={() => toggleParticipant(member)}
                  >
                    <div className={s.participantLeft}>
                      <Avatar name={member} size={22} dark={!on} />
                      <span className={s.participantName}>{member}</span>
                    </div>
                    <div
                      className={`${s.checkbox} ${on ? s.checked : s.unchecked}`}
                    >
                      {on && (
                        <svg width="12" height="10" viewBox="0 0 12 10">
                          <path
                            d="M1 5 L4.5 8.5 L11 1.5"
                            stroke="#0A0A0A"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="square"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className={s.scrollBottom} />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className={s.submitBar}>
          <button
            className={`${s.submitBtn} ${canSave && !saving ? s.ready : s.notReady}`}
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            <span>{saving ? "저장하고 있어요." : "지출 입력"}</span>
            <Chevron dir="right" size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
