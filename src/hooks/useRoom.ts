import { useEffect, useState } from "react";
import { ref, onValue, runTransaction } from "firebase/database";
import { db } from "../lib/firebase";
import { useLocalRooms } from "./useLocalRooms";
import { useHiddenRooms } from "./useHiddenRooms";
import type { Expense, RoomWithExpenses } from "../types";

/**
 * 방 인원을 1명 추가한다.
 * runTransaction으로 동시 접속 race condition을 방지하고,
 * 트랜잭션 내부에서도 중복·최대 인원(10명)을 재검증한다.
 */
export async function addMember(roomId: string, name: string): Promise<void> {
  const membersRef = ref(db, `rooms/${roomId}/members`);
  await runTransaction(membersRef, (current) => {
    const members: string[] = current ?? [];
    // 트랜잭션 내 재검증 — 동시 추가 시 중복·초과 방지
    if (members.includes(name)) return members;
    if (members.length >= 10) return members;
    return [...members, name];
  });
}

/**
 * 네비게이션 간 데이터를 유지하는 모듈 레벨 캐시.
 * 같은 roomId로 재방문 시 Firebase 첫 응답 전에도 즉시 렌더링할 수 있다.
 * Firebase 구독은 백그라운드에서 계속 최신 데이터를 받아 캐시와 state를 갱신한다.
 */
const roomCache = new Map<string, RoomWithExpenses>();

/**
 * Firebase Realtime Database에서 특정 방(room)을 실시간으로 구독한다.
 * 방이 존재하지 않거나 네트워크 오류 시 error 상태를 반환한다.
 *
 * expenses는 최신순(createdAt 내림차순)으로 정렬해 반환한다.
 *
 * loading은 파생 상태로 관리한다: dataRoomId !== roomId 이면 로딩 중.
 * 이렇게 하면 roomId가 바뀔 때 effect 본문에서 setState를 동기 호출하지 않아도
 * 자동으로 loading=true가 된다. (동기 setState → 연쇄 리렌더 경고 회피)
 */
export function useRoom(roomId: string) {
  const cached = roomCache.get(roomId) ?? null;
  const [room, setRoom] = useState<RoomWithExpenses | null>(cached);
  const [error, setError] = useState<string | null>(null);
  // 캐시가 있으면 이미 해당 roomId 데이터가 준비된 상태로 시작
  const [dataRoomId, setDataRoomId] = useState(cached ? roomId : "");

  const { removeRoomId } = useLocalRooms();
  const { removeFromHidden } = useHiddenRooms();

  // roomId가 바뀌는 순간 자동으로 true가 되므로 effect 내 동기 setState 불필요
  const loading = dataRoomId !== roomId;

  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(db, `rooms/${roomId}`);

    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // 방장이 삭제한 방 — localStorage와 숨김 목록에서 자동 정리
          removeRoomId(roomId);
          removeFromHidden(roomId);
          roomCache.delete(roomId);
          setError("존재하지 않는 방이에요.");
          setRoom(null);
          setDataRoomId(roomId);
          return;
        }

        // Firebase snapshot.val()은 rooms/{roomId} 구조가 보장되므로 캐스팅
        const data = snapshot.val() as Omit<RoomWithExpenses, "id" | "expenses"> & {
          expenses?: Record<string, Omit<Expense, "id">>;
        };

        const expensesRaw = data.expenses ?? {};
        const expenses: Expense[] = Object.entries(expensesRaw).map(([id, val]) => ({
          id,
          ...val,
        }));

        // 최신 지출이 목록 상단에 오도록 내림차순 정렬
        expenses.sort((a, b) => b.createdAt - a.createdAt);

        const roomData: RoomWithExpenses = { id: roomId, ...data, expenses };
        roomCache.set(roomId, roomData);
        setError(null);
        setRoom(roomData);
        setDataRoomId(roomId);
      },
      (err) => {
        // Firebase 권한 오류 또는 네트워크 단절
        console.error("[useRoom] Firebase onValue 오류:", err);
        setError("방 정보를 불러오는 데 실패했어요.");
        setDataRoomId(roomId);
      },
    );

    return () => unsubscribe();
  }, [roomId]);

  return { room, loading, error };
}
