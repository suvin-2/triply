import { useState, useCallback } from 'react';

const STORAGE_KEY = 'triply_hidden_rooms';

function loadHiddenIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHiddenIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/**
 * 홈 목록에서 숨길 방 ID를 localStorage로 관리한다.
 * 숨긴 방은 홈에서 보이지 않고 /hidden 화면에서 복원할 수 있다.
 */
export function useHiddenRooms() {
  const [hiddenRoomIds, setHiddenRoomIds] = useState<string[]>(loadHiddenIds);

  const hideRoom = useCallback((roomId: string) => {
    setHiddenRoomIds((prev) => {
      if (prev.includes(roomId)) return prev;
      const next = [...prev, roomId];
      saveHiddenIds(next);
      return next;
    });
  }, []);

  const restoreRoom = useCallback((roomId: string) => {
    setHiddenRoomIds((prev) => {
      const next = prev.filter((id) => id !== roomId);
      saveHiddenIds(next);
      return next;
    });
  }, []);

  const removeFromHidden = useCallback((roomId: string) => {
    setHiddenRoomIds((prev) => {
      const next = prev.filter((id) => id !== roomId);
      saveHiddenIds(next);
      return next;
    });
  }, []);

  const isHidden = useCallback(
    (roomId: string) => hiddenRoomIds.includes(roomId),
    [hiddenRoomIds],
  );

  return { hiddenRoomIds, hideRoom, restoreRoom, removeFromHidden, isHidden };
}
