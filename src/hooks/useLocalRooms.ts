import { useState, useCallback } from 'react';

const STORAGE_KEY = 'triply_rooms';

/**
 * localStorage에서 방문한 방 ID 목록을 읽어온다.
 * 파싱 실패 시 빈 배열을 반환해 앱이 중단되지 않게 한다.
 */
function loadIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    // localStorage 데이터가 손상된 경우 조용히 초기화
    return [];
  }
}

function saveIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/**
 * 사용자가 방문한 방 ID 목록을 localStorage에 영속 저장하며 관리한다.
 * 홈 화면에서 내 여행 목록을 구성할 때 사용한다.
 *
 * @returns roomIds, addRoomId(중복 무시), removeRoomId
 */
export function useLocalRooms() {
  const [roomIds, setRoomIds] = useState<string[]>(loadIds);

  const addRoomId = useCallback((id: string) => {
    setRoomIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [id, ...prev];
      saveIds(next);
      return next;
    });
  }, []);

  const removeRoomId = useCallback((id: string) => {
    setRoomIds((prev) => {
      const next = prev.filter((x) => x !== id);
      saveIds(next);
      return next;
    });
  }, []);

  return { roomIds, addRoomId, removeRoomId };
}
