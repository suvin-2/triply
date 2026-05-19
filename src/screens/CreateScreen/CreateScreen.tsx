import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, set } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useLocalRooms } from '../../hooks/useLocalRooms';
import { toFirebaseDate } from '../../utils/formatDate';
import { Caps, Chevron, PrimaryBtn } from '../../components/shared/atoms';
import CharCounter from '../../components/shared/CharCounter';
import s from './CreateScreen.module.scss';

/**
 * 2본 — 방 개설 화면.
 * 여행 이름·날짜·인원을 입력하면 Firebase에 방을 생성하고,
 * 초대 링크를 보여주는 성공 오버레이를 표시한다.
 */
export default function CreateScreen() {
  const navigate = useNavigate();
  const { addRoomId } = useLocalRooms();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');
  // isComposing: 한글 IME 조합 중 Enter 이벤트 중복 방지 (nativeEvent가 더 신뢰할 수 있어 state는 fallback용)
  const [isComposing, setIsComposing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 종료일이 시작일보다 이른 경우 에러 (YYYY-MM-DD 문자열은 사전순 비교로 날짜 비교 가능)
  const dateError =
    startDate && endDate && endDate < startDate
      ? '종료일이 시작일보다 이를 수 없어요'
      : '';

  const canSubmit = name.trim().length > 0 && members.length >= 2 && !dateError;
  const inviteLink = createdId
    ? `${window.location.origin}/room/${createdId}`
    : '';

  function addMember() {
    // maxLength={10}은 이름 글자수 제한이고, 이 체크는 배열 길이(최대 인원) 제한
    if (members.length >= 10) return;
    const v = memberInput.trim();
    if (!v || members.includes(v)) return;
    setMembers((prev) => [...prev, v]);
    setMemberInput('');
  }

  function removeMember(m: string) {
    setMembers((prev) => prev.filter((x) => x !== m));
  }

  async function handleCreate() {
    if (!canSubmit || creating) return;
    setCreating(true);
    try {
      // Firebase push로 고유 roomId 생성
      const roomRef = push(ref(db, 'rooms'));
      const roomId = roomRef.key!;
      const ownerToken = crypto.randomUUID();
      const fbStart = toFirebaseDate(startDate);
      // endDate가 비어 있으면 startDate로 채워 당일치기로 처리
      const fbEnd = endDate ? toFirebaseDate(endDate) : fbStart;
      await set(roomRef, {
        name: name.trim(),
        startDate: fbStart,
        endDate: fbEnd,
        members,
        status: 'active',
        createdAt: Date.now(),
        ownerToken,
      });
      // 방장 토큰을 이 기기에 저장 — 삭제 권한 확인에 사용
      localStorage.setItem(`triply_owner_${roomId}`, ownerToken);
      addRoomId(roomId);
      setCreatedId(roomId);
    } catch (err) {
      console.error('[CreateScreen] 방 생성 실패:', err);
      alert('방을 만드는 데 실패했어요. 다시 시도해주세요.');
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      // 2초 후 복사 완료 상태 초기화
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원 환경 — 조용히 무시
    }
  }

  function handleStart() {
    if (createdId) navigate(`/room/${createdId}`);
  }

  return (
    <div className={s.screen}>
      {/* 상단 바 */}
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={() => navigate('/')} aria-label="뒤로">
          <Chevron dir="left" size={14} color="#0A0A0A" />
        </button>
        <span className={s.stepLabel}>STEP 01 / 01</span>
        <div style={{ width: 22 }} />
      </div>

      {/* 타이틀 */}
      <div className={s.titleBlock}>
        <h2 className={s.title}>
          새 여행을
          <br />
          <span className={s.titleMuted}>시작해볼까요?</span>
        </h2>
      </div>

      {/* 폼 */}
      <div className={s.form}>
        {/* 여행 이름 */}
        <div className={s.fieldGroup}>
          <Caps style={{ marginBottom: 12 }}>여행 이름</Caps>
          <input
            className={s.fieldInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="제주 3박 4일"
            maxLength={30}
          />
          <CharCounter current={name.length} max={30} />
        </div>

        {/* 날짜 */}
        <div className={s.fieldGroup}>
          <Caps style={{ marginBottom: 12 }}>여행 날짜</Caps>
          <div className={s.dateRow}>
            <input
              type="date"
              className={s.dateInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className={s.dateSep}>—</span>
            <input
              type="date"
              className={s.dateInput}
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {dateError && <p className={s.dateError}>{dateError}</p>}
        </div>

        {/* 인원 */}
        <div className={s.fieldGroup}>
          <Caps style={{ marginBottom: 12 }}>{`인원 (${members.length}명)`}</Caps>
          {members.length > 0 && (
            <div className={s.memberChips}>
              {members.map((m) => (
                <span key={m} className={s.chip}>
                  {m}
                  <button
                    className={s.chipRemove}
                    onClick={() => removeMember(m)}
                    aria-label={`${m} 삭제`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className={s.memberInputRow}>
            <input
              className={s.memberInput}
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                // nativeEvent.isComposing은 브라우저 동기 값이므로 state보다 신뢰도 높음
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && !isComposing) addMember();
              }}
              placeholder="이름 입력 후 엔터"
              maxLength={10}
              disabled={members.length >= 10}
            />
            <button className={s.addBtn} onClick={addMember} disabled={members.length >= 10}>
              + 추가
            </button>
          </div>
          {members.length >= 10 ? (
            <p className={s.limitMsg}>최대 10명까지 추가할 수 있어요</p>
          ) : (
            <CharCounter current={memberInput.length} max={10} />
          )}
        </div>

        <div className={s.formBottom} />
      </div>

      {/* 하단 CTA */}
      <div className={s.bottom}>
        <PrimaryBtn onClick={handleCreate} disabled={!canSubmit || creating}>
          <span>{creating ? '생성 중...' : '방 만들고 링크 공유'}</span>
          <Chevron dir="right" size={14} color="#fff" />
        </PrimaryBtn>
      </div>

      {/* 성공 오버레이 — 방 생성 후 표시 */}
      {createdId && (
        <div className={s.overlay}>
          <div className={s.overlaySheet}>
            <div className={s.overlayHandle} />
            <p className={s.overlayTitle}>방이 만들어졌어요!</p>
            <p className={s.overlayDesc}>
              아래 링크를 친구들에게 공유하면 바로 입장할 수 있어요.
            </p>

            <div className={s.linkBox}>
              <span className={s.linkText}>{inviteLink}</span>
              <button
                className={`${s.copyBtn} ${copied ? s.copyDone : ''}`}
                onClick={handleCopy}
              >
                {copied ? '복사됨' : '복사'}
              </button>
            </div>

            <button className={s.startBtn} onClick={handleStart}>
              <span>여행 시작하기</span>
              <Chevron dir="right" size={14} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
