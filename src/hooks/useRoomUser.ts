import { useState, useCallback } from 'react';

/**
 * 방별 사용자 이름 저장 키를 생성한다.
 * 전역 키 대신 방 단위로 분리해 여러 방에 다른 이름으로 입장할 수 있게 한다.
 */
function storageKey(roomId: string): string {
  return `triply_name_${roomId}`;
}

/**
 * 특정 방(roomId)에 저장된 사용자 이름을 localStorage에서 읽고 쓴다.
 * /room/:roomId 진입 시에만 호출한다.
 *
 * hasName이 false이면 이름 입력 모달을 표시해야 한다.
 *
 * @param roomId - 이름을 저장할 방의 ID
 * @returns { name, saveName, hasName }
 */
export function useRoomUser(roomId: string) {
  const [name, setNameState] = useState<string>(() => {
    return localStorage.getItem(storageKey(roomId)) ?? '';
  });

  /** trim 후 저장하여 공백만 있는 이름이 들어오지 않게 한다. */
  const saveName = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      localStorage.setItem(storageKey(roomId), trimmed);
      setNameState(trimmed);
    },
    [roomId],
  );

  return { name, saveName, hasName: name.length > 0 };
}
