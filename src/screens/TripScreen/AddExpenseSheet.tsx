import { useState, useEffect } from 'react';
import { ref, push } from 'firebase/database';
import { db } from '../../lib/firebase';
import { Avatar, Caps, Chevron } from '../../components/shared/atoms';
import { fmt } from '../../utils/format';
import { CATEGORIES } from '../../types';
import type { RoomWithExpenses, ExpenseCategory } from '../../types';
import s from './AddExpenseSheet.module.scss';

interface Props {
  room: RoomWithExpenses;
  onClose: () => void;
}

/**
 * 4본 — 지출 추가 바텀시트.
 * TripScreen 위에 88% 높이로 슬라이드업 렌더링된다.
 * 커스텀 키패드로 금액을 입력하고, Firebase에 지출을 저장한다.
 */
export default function AddExpenseSheet({ room, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(room.members[0] ?? '');
  const [splitWith, setSplitWith] = useState<string[]>([...room.members]);
  const [category, setCategory] = useState<ExpenseCategory>('식사');
  const [submitting, setSubmitting] = useState(false);

  // mount 후 10ms 뒤 visible=true → CSS 트랜지션 실행
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(id);
  }, []);

  const numAmount = parseInt(amount || '0', 10) || 0;
  const perPerson = splitWith.length > 0 ? numAmount / splitWith.length : 0;
  const canSubmit = title.trim().length > 0 && numAmount > 0 && splitWith.length > 0;
  const allSelected = splitWith.length === room.members.length;

  // ─── 커스텀 키패드 입력 처리 ─────────────────────────────
  function pressKey(key: string) {
    if (key === 'del') {
      setAmount((prev) => prev.slice(0, -1));
      return;
    }
    // '00'은 값이 이미 있을 때만 추가 (0000 방지)
    if (key === '00') {
      setAmount((prev) => (prev === '' ? '' : prev + '00'));
      return;
    }
    // 앞자리 0 제거 후 추가
    setAmount((prev) => (prev + key).replace(/^0+/, '') || '0');
  }

  function toggleParticipant(member: string) {
    setSplitWith((prev) =>
      prev.includes(member) ? prev.filter((x) => x !== member) : [...prev, member],
    );
  }

  function toggleAll() {
    setSplitWith(allSelected ? [] : [...room.members]);
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await push(ref(db, `rooms/${room.id}/expenses`), {
        title: title.trim(),
        amount: numAmount,
        paidBy,
        splitWith,
        category,
        createdAt: Date.now(),
      });
      onClose();
    } catch (err) {
      console.error('[AddExpenseSheet] 지출 추가 실패:', err);
      alert('지출 추가에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'] as const;

  return (
    <div
      className={`${s.overlay} ${visible ? s.visible : ''}`}
      onClick={onClose}
    >
      <div
        className={`${s.sheet} ${visible ? s.visible : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className={s.handle}>
          <div className={s.handleBar} />
        </div>

        {/* 시트 헤더 */}
        <div className={s.sheetHeader}>
          <div className={s.sheetTitle}>
            <Caps>NEW</Caps>
            <span className={s.sheetTitleText}>지출 추가</span>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M2 2L16 16M16 2L2 16" stroke="#0A0A0A" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className={s.scrollArea}>
          {/* 금액 — 히어로 디스플레이 */}
          <div className={s.amountBlock}>
            <div className={`mono ${s.amountDisplay} ${numAmount === 0 ? s.empty : s.filled}`}>
              {numAmount === 0 ? '0' : fmt(numAmount)}
              <span className={s.amountUnit}>원</span>
            </div>
            {numAmount > 0 && splitWith.length > 0 && (
              <div className={s.perPersonLabel}>
                1인당{' '}
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
              placeholder="흑돼지, 렌터카, 숙소..."
            />
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

          {/* 결제한 사람 — 단일 선택 */}
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
                  {member}
                </button>
              ))}
            </div>
          </div>

          {/* 참여 인원 — 다중 토글 */}
          <div className={s.fieldSection}>
            <div className={s.participantHeader}>
              <div className={s.fieldLabel} style={{ marginBottom: 0 }}>
                참여 인원 ({splitWith.length}/{room.members.length})
              </div>
              <button className={s.toggleAllBtn} onClick={toggleAll}>
                {allSelected ? '전체 해제' : '전체 선택'}
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
                    <div className={`${s.checkbox} ${on ? s.checked : s.unchecked}`}>
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

        {/* 커스텀 숫자 키패드 */}
        <div className={s.keypad}>
          <div className={s.keypadGrid}>
            {KEYPAD.map((key) => (
              <button key={key} className={s.keyBtn} onClick={() => pressKey(key)}>
                {key === 'del' ? (
                  // 백스페이스 아이콘
                  <svg width="22" height="16" viewBox="0 0 22 16">
                    <path
                      d="M7 1h13a2 2 0 012 2v10a2 2 0 01-2 2H7L1 8 7 1z"
                      fill="none"
                      stroke="#0A0A0A"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M10 5l6 6M16 5l-6 6"
                      stroke="#0A0A0A"
                      strokeWidth="1.4"
                      strokeLinecap="square"
                    />
                  </svg>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className={s.submitBar}>
          <button
            className={`${s.submitBtn} ${canSubmit && !submitting ? s.ready : s.notReady}`}
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            <span>
              {submitting
                ? '추가 중...'
                : canSubmit
                  ? `${fmt(numAmount)}원 추가하기`
                  : '항목명 · 금액 입력'}
            </span>
            <Chevron dir="right" size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
