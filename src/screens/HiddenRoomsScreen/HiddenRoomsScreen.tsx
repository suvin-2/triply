import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHiddenRooms } from '../../hooks/useHiddenRooms';
import { useLocalRooms } from '../../hooks/useLocalRooms';
import { useRooms } from '../../hooks/useRooms';
import { formatDateLabel } from '../../utils/formatDate';
import { AvatarStack, Caps, Chevron } from '../../components/shared/atoms';
import s from './HiddenRoomsScreen.module.scss';

/**
 * 숨긴 여행 목록 화면.
 * hiddenRoomIds의 방만 표시하며, Firebase에 없는 방(방장이 삭제)은
 * 자동으로 hiddenRoomIds에서 제거한다.
 */
export default function HiddenRoomsScreen() {
  const navigate = useNavigate();
  const { hiddenRoomIds, restoreRoom, removeFromHidden } = useHiddenRooms();
  const { addRoomId } = useLocalRooms();
  const { rooms, confirmedMissingIds } = useRooms(hiddenRoomIds);

  // Firebase가 존재하지 않는다고 확인한 방만 hiddenRoomIds에서 정리
  // 로딩 중인 방(아직 Firebase 응답 없음)은 건드리지 않음
  useEffect(() => {
    confirmedMissingIds.forEach((id) => {
      if (hiddenRoomIds.includes(id)) removeFromHidden(id);
    });
  }, [confirmedMissingIds, hiddenRoomIds, removeFromHidden]);

  function handleRestore(roomId: string) {
    restoreRoom(roomId);
    addRoomId(roomId);
  }

  return (
    <div className={s.screen}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={() => navigate('/')} aria-label="뒤로">
          <Chevron dir="left" size={14} color="#0A0A0A" />
        </button>
        <span className={s.topTitle}>숨긴 여행</span>
        <div style={{ width: 22 }} />
      </div>

      <div className={s.listHeader}>
        <Caps>숨긴 여행</Caps>
        <span className={`mono ${s.listCount}`}>{rooms.length} TRIPS</span>
      </div>

      <div className={s.list}>
        {rooms.length === 0 && (
          <div className={s.empty}>
            숨긴 여행이 없어요.
          </div>
        )}

        {rooms.map((room) => (
          <div key={room.id} className={s.roomItem}>
            <div className={s.roomInfo}>
              <div className={s.roomNameRow}>
                <span className={s.roomName}>{room.name}</span>
                {room.status === 'done' && (
                  <span className={s.statusDone}>정산완료</span>
                )}
              </div>
              <div className={s.roomMeta}>
                <span className={s.roomDate}>
                  {formatDateLabel(room.startDate, room.endDate)}
                </span>
                <span className={s.metaDot} />
                <AvatarStack names={room.members} size={18} max={4} />
              </div>
            </div>
            <button
              className={s.restoreBtn}
              onClick={() => handleRestore(room.id)}
            >
              복원
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
