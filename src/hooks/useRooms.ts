import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import type { Room } from '../types';

/**
 * roomIds 배열에 해당하는 방들을 Firebase에서 동시에 실시간 구독한다.
 * 홈 화면에서 expenses 없이 방 목록만 표시할 때 사용한다.
 *
 * roomIds 배열이 바뀌면 기존 구독을 모두 해제하고 새로 구독한다.
 * 존재하지 않는 roomId는 결과에서 제외한다.
 *
 * @param roomIds - 구독할 방 ID 목록 (localStorage에서 로드)
 * @returns Room 배열 (createdAt 내림차순)
 */
export function useRooms(roomIds: string[]): Room[] {
  const [rooms, setRooms] = useState<Record<string, Room>>({});

  // join으로 비교 — Firebase key는 쉼표를 포함하지 않으므로 안전
  const key = roomIds.join(',');

  useEffect(() => {
    if (roomIds.length === 0) {
      setRooms({});
      return;
    }

    const unsubscribers: (() => void)[] = [];

    roomIds.forEach((id) => {
      const roomRef = ref(db, `rooms/${id}`);

      const unsub = onValue(
        roomRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            // 방이 삭제됐거나 존재하지 않으면 목록에서 제거
            setRooms((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            return;
          }

          // Firebase snapshot.val()은 rooms/{id} 구조가 보장되므로 캐스팅
          const data = snapshot.val() as Omit<Room, 'id'>;
          setRooms((prev) => ({ ...prev, [id]: { id, ...data } }));
        },
        (err) => {
          // 권한 오류 등 — 해당 방만 조용히 제외
          console.error(`[useRooms] rooms/${id} 구독 오류:`, err);
        },
      );

      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // createdAt 내림차순 정렬 (최근 방이 위로)
  return Object.values(rooms).sort((a, b) => b.createdAt - a.createdAt);
}
