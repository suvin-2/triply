/**
 * 사용자 입력에서 8자리 초대 코드를 추출한다.
 *
 * - 대소문자 구분 없이 입력받아 대문자로 정규화
 * - I, O, 0, 1 을 제외한 영문 대문자 + 숫자 8자리만 유효
 * - 유효하지 않은 입력: `null` 반환
 *
 * @param input - 사용자가 입력한 문자열
 * @returns 정규화된 8자리 초대 코드 또는 null
 */

const INVITE_CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

export function parseRoomId(input: string): string | null {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return null;
  if (INVITE_CODE_RE.test(trimmed)) return trimmed;
  return null;
}
