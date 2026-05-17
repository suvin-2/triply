/**
 * 현재 기기가 해당 방의 방장인지 확인한다.
 * localStorage의 ownerToken과 Firebase에서 넘어온 ownerToken을 비교.
 * ownerToken이 undefined이면 구버전 방(토큰 미발급)으로 간주해 false 반환.
 */
export function isOwner(roomId: string, ownerToken?: string): boolean {
  if (!ownerToken) return false;
  const stored = localStorage.getItem(`triply_owner_${roomId}`);
  return stored === ownerToken;
}
