/**
 * 사용자 입력(초대 링크 또는 roomId 직접 입력)에서 roomId를 추출한다.
 *
 * - URL 형태: `https://triply.vercel.app/room/abc123` → `'abc123'`
 * - 직접 입력: `abc123` → `'abc123'`
 * - 유효하지 않은 입력: `null` 반환
 *
 * roomId는 영숫자·하이픈·언더스코어만 허용 (Firebase key 규칙 준수).
 *
 * @param input - 사용자가 입력한 문자열
 * @returns roomId 문자열 또는 null
 */
export function parseRoomId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // URL 형태면 /room/{id} 경로에서 추출
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/room\/([^/]+)/);
    if (match?.[1]) return match[1];
  } catch {
    // URL 파싱 실패 → 직접 입력된 roomId로 처리
  }

  // roomId 직접 입력: Firebase key로 사용 가능한 문자만 허용
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

  return null;
}
