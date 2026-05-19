/**
 * I, O, 0, 1 처럼 혼동되는 문자를 제외한 영문 대문자+숫자 집합.
 * 발음 가능하고 식별하기 쉬운 문자만 사용한다.
 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * 8자리 랜덤 초대 코드를 생성한다.
 * 충돌 검사 없이 순수하게 생성만 담당 — 중복 체크는 호출 측에서 수행.
 */
export function generateInviteCode(): string {
  return Array.from({ length: 8 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)],
  ).join('');
}
