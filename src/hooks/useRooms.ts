import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import type { Room } from "../types";

// 앱 생명주기 동안 유지되는 방 데이터 캐시
// 홈 재진입 시 Firebase 응답 전에 이전 데이터를 즉시 표시하기 위함
const roomsCache: Record<string, Room> = {};

// Firebase가 없다고 확인한 ID 캐시 — 로딩 중과 확실히 없는 것을 구분
const missingCache = new Set<string>();

/**
 * roomIds 배열에 해당하는 방들을 Firebase에서 동시에 실시간 구독한다.
 * 홈 화면에서 expenses 없이 방 목록만 표시할 때 사용한다.
 *
 * roomIds 배열이 바뀌면 기존 구독을 모두 해제하고 새로 구독한다.
 * 존재하지 않는 roomId는 결과에서 제외하고, confirmedMissingIds에 포함한다.
 * 한 번 받아온 방 데이터는 모듈 캐시에 보관해 재진입 시 즉시 표시한다.
 *
 * @param roomIds - 구독할 방 ID 목록 (localStorage에서 로드)
 * @returns rooms(Room 배열, createdAt 내림차순), confirmedMissingIds(Firebase가 없다고 확인한 ID Set)
 */
export function useRooms(roomIds: string[]): {
  rooms: Room[];
  confirmedMissingIds: Set<string>;
  loading: boolean;
} {
  const [rooms, setRooms] = useState<Record<string, Room>>(() =>
    Object.fromEntries(roomIds.filter((id) => id in roomsCache).map((id) => [id, roomsCache[id]])),
  );
  // Firebase가 snapshot.exists() === false 로 응답한 ID만 여기에 담음
  const [confirmedMissingIds, setConfirmedMissingIds] = useState<Set<string>>(
    () => new Set(roomIds.filter((id) => missingCache.has(id))),
  );

  // join으로 비교 — Firebase key는 쉼표를 포함하지 않으므로 안전
  const key = roomIds.join(",");

  useEffect(() => {
    if (roomIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 구독 없이 즉시 초기화 필요한 early-return 패턴
      setRooms({});
      setConfirmedMissingIds(new Set());
      return;
    }

    // 캐시된 방은 즉시 복원, 나머지는 Firebase 응답 대기
    setRooms(
      Object.fromEntries(
        roomIds.filter((id) => id in roomsCache).map((id) => [id, roomsCache[id]]),
      ),
    );
    setConfirmedMissingIds(new Set(roomIds.filter((id) => missingCache.has(id))));

    const unsubscribers: (() => void)[] = [];

    roomIds.forEach((id) => {
      const roomRef = ref(db, `rooms/${id}`);

      const unsub = onValue(
        roomRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            // Firebase가 없다고 확인 — 두 캐시 모두 업데이트
            delete roomsCache[id];
            missingCache.add(id);
            setConfirmedMissingIds((prev) => new Set([...prev, id]));
            setRooms((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            return;
          }
          // 존재 확인된 방은 missing 캐시에서 제거 (상태 변경 가능성 대비)
          missingCache.delete(id);
          setConfirmedMissingIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });

          // Firebase snapshot.val()은 rooms/{id} 구조가 보장되므로 캐스팅
          const data = snapshot.val() as Omit<Room, "id">;
          const room = { id, ...data };
          roomsCache[id] = room;
          setRooms((prev) => ({ ...prev, [id]: room }));
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

  // loading을 React state가 아닌 모듈 캐시에서 직접 계산
  // — 재마운트 시에도 타이밍 문제 없이 즉시 올바른 값을 반환
  const loading =
    roomIds.length > 0 && roomIds.some((id) => !(id in roomsCache) && !missingCache.has(id));

  // createdAt 내림차순 정렬 (최근 방이 위로)
  return {
    rooms: Object.values(rooms).sort((a, b) => b.createdAt - a.createdAt),
    confirmedMissingIds,
    loading,
  };
}
