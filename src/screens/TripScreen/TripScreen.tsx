import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ref, remove } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useRoom } from '../../hooks/useRoom';
import { useLocalRooms } from '../../hooks/useLocalRooms';
import { useHiddenRooms } from '../../hooks/useHiddenRooms';
import { useRoomUser } from '../../hooks/useRoomUser';
import { isOwner } from '../../utils/isOwner';
import { Avatar, AvatarStack, Chevron } from '../../components/shared/atoms';
import { fmt, fmtTimestamp } from '../../utils/format';
import { formatDateLabel } from '../../utils/formatDate';
import { CATEGORIES } from '../../types';
import type { ExpenseCategory } from '../../types';
import AddExpenseSheet from './AddExpenseSheet';
import s from './TripScreen.module.scss';

type FilterCategory = '전체' | ExpenseCategory;
const FILTER_CATS: FilterCategory[] = ['전체', ...CATEGORIES];

/**
 * 3본 — 지출 목록 화면.
 * Firebase에서 방 정보와 지출 내역을 실시간 구독한다.
 * 진입 시 이름이 없으면 이름 입력 모달을 표시한다.
 * FAB(+) → 4본 바텀시트(STEP 8에서 연결), 정산하기 → 5본.
 */
export default function TripScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { addRoomId } = useLocalRooms();

  const { room, loading, error } = useRoom(roomId ?? '');
  const { saveName, hasName } = useRoomUser(roomId ?? '');

  const [filter, setFilter] = useState<FilterCategory>('전체');
  const [nameInput, setNameInput] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { hideRoom } = useHiddenRooms();

  // 방 진입 시 localStorage에 roomId 등록 (초대 링크로 직접 진입한 경우 대비)
  // 렌더 중 setState 호출 금지 — useEffect로 이동
  useEffect(() => {
    if (roomId) addRoomId(roomId);
  }, [roomId, addRoomId]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // ─── 로딩 / 에러 상태 ─────────────────────────────────────
  if (loading) {
    return (
      <div className={s.screen}>
        <div className={s.center}>
          <p className={s.loadingText}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className={s.screen}>
        <div className={s.center}>
          <p className={s.errorText}>{error ?? '방 정보를 찾을 수 없어요.'}</p>
          <button onClick={() => navigate('/')} style={{ fontSize: 13, color: '#8C8579', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ─── 방장 여부 + 액션 핸들러 ──────────────────────────────
  const canDelete = isOwner(roomId!, room.ownerToken) && room.status === 'done';

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await remove(ref(db, `rooms/${roomId}`));
      localStorage.removeItem(`triply_owner_${roomId}`);
      navigate('/');
    } catch (err) {
      console.error('[TripScreen] 방 삭제 실패:', err);
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDeleting(false);
    }
  }

  function handleHide() {
    hideRoom(roomId!);
    navigate('/');
  }

  // ─── 통계 계산 ────────────────────────────────────────────
  const total = room.expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = room.members.length > 0 ? total / room.members.length : 0;

  // ─── 카테고리 필터 ────────────────────────────────────────
  const filtered =
    filter === '전체' ? room.expenses : room.expenses.filter((e) => e.category === filter);

  // ─── 이름 확인 ────────────────────────────────────────────
  const canConfirmName = nameInput.trim().length > 0;

  function handleConfirmName() {
    if (!canConfirmName) return;
    saveName(nameInput);
  }

  return (
    <div className={s.screen}>
      {/* 상단 바 */}
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={() => navigate('/')} aria-label="뒤로">
          <Chevron dir="left" size={14} color="#0A0A0A" />
        </button>

        {room.status === 'active' && (
          <div className={s.liveChip}>
            <span className={s.liveDot} />
            <span className={`mono ${s.liveLabel}`}>LIVE</span>
          </div>
        )}

        <div className={s.menuWrap} ref={menuRef}>
          <button
            className={s.menuBtn}
            aria-label="메뉴"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle cx="4" cy="10" r="1.5" fill="#0A0A0A" />
              <circle cx="10" cy="10" r="1.5" fill="#0A0A0A" />
              <circle cx="16" cy="10" r="1.5" fill="#0A0A0A" />
            </svg>
          </button>
          {menuOpen && (
            <div className={s.dropdown}>
              <button
                className={s.dropdownItem}
                onClick={() => { setMenuOpen(false); handleHide(); }}
              >
                이 여행 숨기기
              </button>
              {canDelete && (
                <button
                  className={`${s.dropdownItem} ${s.dropdownItemDanger}`}
                  onClick={() => { setMenuOpen(false); setDeleteConfirmOpen(true); }}
                >
                  이 여행 삭제하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 히어로 — 여행 이름 + 통계 */}
      <div className={s.hero}>
        <h2 className={s.tripName}>{room.name}</h2>
        <div className={s.tripMeta}>
          <span className={s.tripDate}>
            {formatDateLabel(room.startDate, room.endDate)}
          </span>
          <span className={s.metaDot} />
          <AvatarStack names={room.members} size={20} />
        </div>

        {/* 총 지출 / 1인 평균 그리드 */}
        <div className={s.stats}>
          <div className={s.statCell}>
            <div className={s.statLabel}>총 지출</div>
            <div className={`mono ${s.statNumber}`}>{fmt(total)}</div>
            <div className={s.statSub}>KRW · {room.expenses.length}건</div>
          </div>
          <div className={s.statCell}>
            <div className={s.statLabel}>1인 평균</div>
            <div className={`mono ${s.statNumber}`}>{fmt(perPerson)}</div>
            <div className={s.statSub}>÷ {room.members.length}명</div>
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className={s.filters}>
        {FILTER_CATS.map((cat) => (
          <button
            key={cat}
            className={`${s.filterChip} ${filter === cat ? s.active : s.inactive}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 지출 목록 */}
      <div className={s.expenseList}>
        {filtered.length === 0 && (
          <div className={s.emptyList}>
            {filter === '전체' ? '아직 지출이 없어요' : `${filter} 항목이 없어요`}
          </div>
        )}

        {filtered.map((expense) => (
          <div key={expense.id} className={s.expenseItem}>
            {/* 카테고리 + 날짜 */}
            <div className={s.expenseMeta}>
              <div className={s.expenseCategory}>{expense.category}</div>
              <div className={s.expenseDate}>
                {fmtTimestamp(expense.createdAt).split(' ')[0]}
              </div>
            </div>

            {/* 항목명 + 결제 정보 */}
            <div className={s.expenseBody}>
              <div className={s.expenseTitle}>{expense.title}</div>
              <div className={s.expensePayer}>
                <Avatar name={expense.paidBy} size={16} dark />
                <span className={s.payerName}>{expense.paidBy} 결제</span>
                <span className={s.payerDot} />
                <span className={s.splitCount}>{expense.splitWith.length}명 분담</span>
              </div>
            </div>

            {/* 금액 */}
            <div className={s.expenseAmount}>
              <div className={`mono ${s.amountTotal}`}>{fmt(expense.amount)}</div>
              {expense.splitWith.length > 0 && (
                <div className={s.amountPer}>
                  / {fmt(expense.amount / expense.splitWith.length)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FAB + 정산하기 */}
      <div className={s.fabBar}>
        <button
          className={s.fab}
          onClick={() => setAddOpen(true)}
          aria-label="지출 추가"
        >
          +
        </button>
        <button
          className={s.settleBtn}
          onClick={() => navigate(`/room/${roomId}/settle`)}
        >
          <span>정산하기</span>
          <span className={s.settleMeta}>
            <span className={`mono ${s.settleMemberCount}`}>{room.members.length}명</span>
            <Chevron dir="right" size={14} color="#fff" />
          </span>
        </button>
      </div>

      {/* 이름 입력 모달 — 방 첫 진입 시 표시 */}
      {!hasName && (
        <div className={s.nameOverlay}>
          <div className={s.nameSheet}>
            <div className={s.nameHandle} />
            <p className={s.nameTitle}>{room.name}에 입장해요</p>
            <p className={s.nameDesc}>
              지출 기록에 표시될 이름을 입력해주세요.
              <br />
              같은 링크로 재입장하면 자동으로 불러와요.
            </p>
            <input
              className={s.nameInput}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmName()}
              placeholder="내 이름"
              autoFocus
            />
            {/* trim() 후 빈 값이면 disabled — 에러 메시지 없이 버튼만 비활성화 */}
            <button
              className={s.nameConfirmBtn}
              onClick={handleConfirmName}
              disabled={!canConfirmName}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {addOpen && (
        <AddExpenseSheet room={room} onClose={() => setAddOpen(false)} />
      )}

      {/* 방 삭제 확인 다이얼로그 */}
      {deleteConfirmOpen && (
        <div className={s.dialogOverlay} onClick={() => setDeleteConfirmOpen(false)}>
          <div className={s.dialog} onClick={(e) => e.stopPropagation()}>
            <p className={s.dialogTitle}>이 여행을 삭제할까요?</p>
            <p className={s.dialogDesc}>
              삭제하면 모든 데이터가 사라지고 복구할 수 없어요.
            </p>
            <div className={s.dialogBtns}>
              <button className={s.dialogCancel} onClick={() => setDeleteConfirmOpen(false)}>
                취소
              </button>
              <button
                className={s.dialogDelete}
                onClick={() => { setDeleteConfirmOpen(false); handleDelete(); }}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
