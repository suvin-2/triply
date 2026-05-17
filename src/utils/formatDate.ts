/**
 * 시작일·종료일을 화면 표시용 문자열로 변환한다.
 * 당일치기(startDate === endDate)는 날짜를 하나만 표시해 혼동을 줄인다.
 *
 * @param startDate - 시작일 (예: "5.10")
 * @param endDate   - 종료일 (예: "5.13"). 비어 있거나 startDate와 같으면 단일 날짜 반환
 * @returns 포맷된 날짜 문자열 (예: "5.10" 또는 "5.10 — 5.13")
 */
export function formatDateLabel(startDate: string, endDate: string): string {
  if (!endDate || startDate === endDate) return startDate;
  return `${startDate} — ${endDate}`;
}

/**
 * <input type="date">의 YYYY-MM-DD 값을 Firebase 저장용 "M.D" 형식으로 변환한다.
 * 앞자리 0을 제거해 "05.10" 대신 "5.10"으로 만든다.
 *
 * @param dateStr - YYYY-MM-DD 형식 문자열 (예: "2025-05-10")
 * @returns "M.D" 형식 문자열 (예: "5.10"). 빈 값이면 빈 문자열 반환
 */
export function toFirebaseDate(dateStr: string): string {
  if (!dateStr) return '';
  const [, month, day] = dateStr.split('-');
  return `${parseInt(month, 10)}.${parseInt(day, 10)}`;
}
