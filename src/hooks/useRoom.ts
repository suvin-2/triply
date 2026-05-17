import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import type { Expense, RoomWithExpenses } from '../types';

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
  const [room, setRoom] = useState<RoomWithExpenses | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 현재 room/error가 어떤 roomId 기준으로 세팅됐는지 추적
  const [dataRoomId, setDataRoomId] = useState('');

  // roomId가 바뀌는 순간 자동으로 true가 되므로 effect 내 동기 setState 불필요
  const loading = dataRoomId !== roomId;

  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(db, `rooms/${roomId}`);

    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('존재하지 않는 방이에요.');
          setRoom(null);
          setDataRoomId(roomId);
          return;
        }

        // Firebase snapshot.val()은 rooms/{roomId} 구조가 보장되므로 캐스팅
        const data = snapshot.val() as Omit<RoomWithExpenses, 'id' | 'expenses'> & {
          expenses?: Record<string, Omit<Expense, 'id'>>;
        };

        const expensesRaw = data.expenses ?? {};
        const expenses: Expense[] = Object.entries(expensesRaw).map(([id, val]) => ({
          id,
          ...val,
        }));

        // 최신 지출이 목록 상단에 오도록 내림차순 정렬
        expenses.sort((a, b) => b.createdAt - a.createdAt);

        setError(null);
        setRoom({ id: roomId, ...data, expenses });
        setDataRoomId(roomId);
      },
      (err) => {
        // Firebase 권한 오류 또는 네트워크 단절
        console.error('[useRoom] Firebase onValue 오류:', err);
        setError('방 정보를 불러오는 데 실패했어요.');
        setDataRoomId(roomId);
      },
    );

    return () => unsubscribe();
  }, [roomId]);

  return { room, loading, error };
}
