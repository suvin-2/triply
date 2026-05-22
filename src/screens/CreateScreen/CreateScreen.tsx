import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <rect
        x="0.75"
        y="2.75"
        width="12.5"
        height="10.5"
        rx="1.25"
        stroke="#8C8579"
        strokeWidth="1.5"
      />
      <path d="M0.75 6h12.5" stroke="#8C8579" strokeWidth="1.5" />
      <path d="M4 1v3M10 1v3" stroke="#8C8579" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
import { ref, push, set } from "firebase/database";
import { db } from "../../lib/firebase";
import { useLocalRooms } from "../../hooks/useLocalRooms";
import { toFirebaseDate } from "../../utils/formatDate";
import { generateInviteCode } from "../../utils/inviteCode";
import { Caps, Chevron, PrimaryBtn } from "../../components/shared/atoms";
import CharCounter from "../../components/shared/CharCounter";
import s from "./CreateScreen.module.scss";

/**
 * 2본 — 방 개설 화면.
 * 여행 이름·날짜·인원을 입력하면 Firebase에 방을 생성하고,
 * 초대 코드를 보여주는 성공 오버레이를 표시한다.
 */
export default function CreateScreen() {
  const navigate = useNavigate();
  const { addRoomId } = useLocalRooms();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  // isComposing: 한글 IME 조합 중 Enter 이벤트 중복 방지 (nativeEvent가 더 신뢰할 수 있어 state는 fallback용)
  const [isComposing, setIsComposing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  // 날짜 input ref — placeholder overlay 클릭 시 날짜 선택기 열기
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // 종료일이 시작일보다 이른 경우 에러 (YYYY-MM-DD 문자열은 사전순 비교로 날짜 비교 가능)
  const dateError =
    startDate && endDate && endDate < startDate ? "종료일이 시작일보다 이를 수 없어요" : "";

  const canSubmit = name.trim().length > 0 && members.length >= 2 && !dateError;

  /**
   * placeholder span 클릭 시 date input의 날짜 선택기를 연다.
   * 오버레이가 클릭을 가로채므로 input에 직접 클릭이 전달되지 않는다.
   * showPicker()는 user gesture 내 동기 호출 시 picker를 직접 열 수 있다 (Chrome 99+/Android).
   * 미지원 환경은 focus()로 폴백하고, 일부 Android 기기를 위해 setTimeout(0)도 시도한다.
   */
  function focusDateInput(ref: React.RefObject<HTMLInputElement | null>) {
    const input = ref.current;
    if (!input) return;
    input.focus();
    try {
      (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      // showPicker 미지원 또는 user gesture 체인 이탈 시 — focus 재시도
      setTimeout(() => input.focus(), 0);
    }
  }

  function addMember() {
    // maxLength={10}은 이름 글자수 제한이고, 이 체크는 배열 길이(최대 인원) 제한
    if (members.length >= 10) return;
    const v = memberInput.trim();
    if (!v || members.includes(v)) return;
    setMembers((prev) => [...prev, v]);
    setMemberInput("");
  }

  function removeMember(m: string) {
    setMembers((prev) => prev.filter((x) => x !== m));
  }

  async function handleCreate() {
    if (!canSubmit || creating) return;
    setCreating(true);
    try {
      const code = generateInviteCode();
      // Firebase push로 고유 roomId 생성
      const roomRef = push(ref(db, "rooms"));
      const roomId = roomRef.key!;
      // const ownerToken = crypto.randomUUID();
      const ownerToken = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
      const fbStart = toFirebaseDate(startDate);
      // endDate가 비어 있으면 startDate로 채워 당일치기로 처리
      const fbEnd = endDate ? toFirebaseDate(endDate) : fbStart;
      await set(roomRef, {
        name: name.trim(),
        startDate: fbStart,
        endDate: fbEnd,
        members,
        status: "active",
        createdAt: Date.now(),
        ownerToken,
        inviteCode: code,
      });
      // 방장 토큰을 이 기기에 저장 — 삭제 권한 확인에 사용
      localStorage.setItem(`triply_owner_${roomId}`, ownerToken);
      addRoomId(roomId);
      setInviteCode(code);
      setCreatedId(roomId);
    } catch (err) {
      console.error("[CreateScreen] 방 생성 실패:", err);
      alert(err instanceof Error ? err.message : "방을 만드는 데 실패했어요. 다시 시도해주세요.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode);
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
        <button className={s.backBtn} onClick={() => navigate("/")} aria-label="뒤로">
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
            <div className={s.dateInputWrapper}>
              <input
                ref={startInputRef}
                type="date"
                className={s.dateInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {!startDate && (
                <span className={s.datePlaceholder} onClick={() => focusDateInput(startInputRef)}>
                  <span>YYYY.MM.DD</span>
                  <CalendarIcon />
                </span>
              )}
            </div>
            <span className={s.dateSep}>—</span>
            <div className={s.dateInputWrapper}>
              <input
                ref={endInputRef}
                type="date"
                className={s.dateInput}
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {!endDate && (
                <span className={s.datePlaceholder} onClick={() => focusDateInput(endInputRef)}>
                  <span>YYYY.MM.DD</span>
                  <CalendarIcon />
                </span>
              )}
            </div>
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
                if (e.key === "Enter" && !e.nativeEvent.isComposing && !isComposing) addMember();
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
          <span>{creating ? "생성 중..." : "방 만들고 코드 공유"}</span>
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
              아래 초대 코드를 친구들에게 공유하면 바로 입장할 수 있어요.
            </p>

            <div className={s.linkBox}>
              <span className={s.inviteCodeText}>{inviteCode}</span>
              <button className={`${s.copyBtn} ${copied ? s.copyDone : ""}`} onClick={handleCopy}>
                {copied ? "복사됨" : "복사"}
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
