import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import type { Room } from '../types';

/**
 * roomIds 배열에 해당하는 방들을 Firebase에서 동시에 실시간 구독한다.
 * 홈 화면에서 expenses 없이 방 목록만 표시할 때 사용한다.
 *
 * roomIds 배열이 바뀌면 기존 구독을 모두 해제하고 새로 구독한다.
 * 존재하지 않는 roomId는 결과에서 제외하고, confirmedMissingIds에 포함한다.
 *
 * @param roomIds - 구독할 방 ID 목록 (localStorage에서 로드)
 * @returns rooms(Room 배열, createdAt 내림차순), confirmedMissingIds(Firebase가 없다고 확인한 ID Set)
 */
export function useRooms(roomIds: string[]): { rooms: Room[]; confirmedMissingIds: Set<string>; loading: boolean } {
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  // Firebase가 snapshot.exists() === false 로 응답한 ID만 여기에 담음
  // 로딩 중(아직 응답 없음)과 확실히 없는 것을 구분하기 위해 분리
  const [confirmedMissingIds, setConfirmedMissingIds] = useState<Set<string>>(new Set());
  // 첫 Firebase 응답을 받은 roomId를 추적 — 전부 응답 오기 전까지 loading: true
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

  // join으로 비교 — Firebase key는 쉼표를 포함하지 않으므로 안전
  const key = roomIds.join(',');

  useEffect(() => {
    if (roomIds.length === 0) {
      setRooms({});
      setConfirmedMissingIds(new Set());
      setLoadedIds(new Set());
      return;
    }

    setLoadedIds(new Set());

    const unsubscribers: (() => void)[] = [];

    roomIds.forEach((id) => {
      const roomRef = ref(db, `rooms/${id}`);

      // 구독당 첫 응답 여부 — loadedIds 중복 추가 방지
      let firstResponse = true;

      const unsub = onValue(
        roomRef,
        (snapshot) => {
          if (firstResponse) {
            firstResponse = false;
            setLoadedIds((prev) => new Set([...prev, id]));
          }

          if (!snapshot.exists()) {
            // Firebase가 없다고 확인 — confirmedMissingIds에 추가하고 rooms에서 제거
            setConfirmedMissingIds((prev) => new Set([...prev, id]));
            setRooms((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            return;
          }
          // 존재 확인된 방은 missing 목록에서 제거 (상태 변경 가능성 대비)
          setConfirmedMissingIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });

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

  // roomIds가 있으나 아직 전부 응답 안 온 상태 = 로딩 중
  const loading = roomIds.length > 0 && loadedIds.size < roomIds.length;

  // createdAt 내림차순 정렬 (최근 방이 위로)
  return {
    rooms: Object.values(rooms).sort((a, b) => b.createdAt - a.createdAt),
    confirmedMissingIds,
    loading,
  };
}
