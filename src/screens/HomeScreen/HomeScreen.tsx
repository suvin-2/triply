import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalRooms } from '../../hooks/useLocalRooms';
import { useRooms } from '../../hooks/useRooms';
import { useHiddenRooms } from '../../hooks/useHiddenRooms';
import { parseRoomId } from '../../utils/parseRoomId';
import { formatDateLabel } from '../../utils/formatDate';
import { AvatarStack, Caps, Chevron } from '../../components/shared/atoms';
import s from './HomeScreen.module.scss';

/**
 * 1본 — 홈 화면.
 * localStorage에 저장된 방 ID 목록을 기반으로 Firebase에서 방 정보를 실시간 구독해 표시한다.
 * 초대 링크 입력 또는 "새 여행 만들기"로 다른 화면으로 이동한다.
 */
export default function HomeScreen() {
  const navigate = useNavigate();
  const { roomIds, addRoomId } = useLocalRooms();
  const { hiddenRoomIds } = useHiddenRooms();
  const { rooms: allRooms } = useRooms(roomIds);
  const rooms = allRooms.filter((r) => !hiddenRoomIds.includes(r.id));

  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const activeCount = rooms.filter((r) => r.status === 'active').length;

  function handleLinkNavigate() {
    // 빈 값(공백 포함)과 잘못된 형식 모두 동일하게 처리
    const trimmed = link.trim();
    if (!trimmed) {
      setLinkError('올바른 링크 또는 방 코드를 입력해주세요');
      return;
    }
    const roomId = parseRoomId(trimmed);
    if (!roomId) {
      setLinkError('올바른 링크 또는 방 코드를 입력해주세요');
      return;
    }
    setLinkError('');
    addRoomId(roomId);
    navigate(`/room/${roomId}`);
  }

  function handleLinkKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleLinkNavigate();
  }

  return (
    <div className={s.screen}>
      {/* 브랜드 헤더 */}
      <div className={s.header}>
        <div className={s.brand}>
          <div className={s.brandLeft}>
            <span className={s.brandDot} />
            <span className={s.brandName}>TRIPLY</span>
          </div>
          <div className={s.menuWrap} ref={menuRef}>
            <button
              className={s.menuBtn}
              aria-label="메뉴"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="4" cy="11" r="1.5" fill="#0A0A0A" />
                <circle cx="11" cy="11" r="1.5" fill="#0A0A0A" />
                <circle cx="18" cy="11" r="1.5" fill="#0A0A0A" />
              </svg>
            </button>
            {menuOpen && (
              <div className={s.dropdown}>
                <button
                  className={s.dropdownItem}
                  onClick={() => { setMenuOpen(false); navigate('/hidden'); }}
                >
                  숨긴 여행 보기
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={s.titleBlock}>
          <h1 className={s.title}>MY TRIPS</h1>
          <p className={s.subtitle}>
            진행 중인 여행{' '}
            <strong className={s.subtitleBold}>{activeCount}</strong>건
          </p>
        </div>
      </div>

      {/* 방 목록 */}
      <div className={s.roomList}>
        <div className={s.listHeader}>
          <Caps>내 여행</Caps>
          <span className={`mono ${s.listCount}`}>{rooms.length} TRIPS</span>
        </div>

        {rooms.length === 0 && (
          <div className={s.empty}>
            아직 여행이 없어요.
            <br />
            새 여행을 만들거나 초대 링크로 입장해보세요.
          </div>
        )}

        {rooms.map((room) => (
          <button
            key={room.id}
            className={s.roomItem}
            onClick={() => navigate(`/room/${room.id}`)}
          >
            <div className={s.roomRow}>
              <div className={s.roomLeft}>
                <div className={s.roomNameRow}>
                  {room.status === 'active' && <span className={s.liveDot} />}
                  <span className={s.roomName}>{room.name}</span>
                </div>
                <div className={s.roomMeta}>
                  <span className={s.roomDate}>
                    {formatDateLabel(room.startDate, room.endDate)}
                  </span>
                  <span className={s.metaDot} />
                  <AvatarStack names={room.members} size={18} max={4} />
                  {room.status === 'active' ? (
                    <span className={s.statusActive}>진행중</span>
                  ) : (
                    <span className={s.statusDone}>정산완료</span>
                  )}
                </div>
              </div>

              <div className={s.roomRight}>
                <div className={`mono ${s.memberCount}`}>{room.members.length}</div>
                <div className={s.memberLabel}>명</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 하단: 링크 입력 + CTA */}
      <div className={s.bottom}>
        <div className={s.linkRow}>
          <input
            className={s.linkInput}
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              if (linkError) setLinkError('');
            }}
            onKeyDown={handleLinkKeyDown}
            placeholder="초대 링크 붙여넣기"
          />
          <button
            className={`${s.linkBtn} ${link.trim() ? s.hasInput : s.noInput}`}
            onClick={handleLinkNavigate}
            aria-label="링크로 입장"
          >
            <Chevron dir="right" size={14} color={link.trim() ? '#fff' : '#0A0A0A'} />
          </button>
        </div>

        {linkError && <p className={s.linkError}>{linkError}</p>}

        <button className={s.ctaBtn} onClick={() => navigate('/create')}>
          <span>새 여행 만들기</span>
          <span className={s.ctaRight}>
            <span className={s.ctaTag}>NEW</span>
            <Chevron dir="right" size={14} color="#fff" />
          </span>
        </button>
      </div>
    </div>
  );
}
