/**
 * 숫자를 한국 원화 형식으로 포맷한다. (예: 85000 → "85,000")
 */
export const fmt = (n: number): string =>
  new Intl.NumberFormat("ko-KR").format(Math.round(n));

/**
 * 큰 숫자를 축약 표기한다. 100만 이상은 "1.2M" 형태로.
 * 홈 화면 방 카드처럼 공간이 좁은 곳에서 사용한다.
 */
export const fmtCompact = (n: number): string => {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  return fmt(n);
};

/**
 * 금액 자릿수에 따라 base font-size를 비율로 줄여 반환한다.
 * 7자리 이하: base 그대로
 * 8자리: ×0.875
 * 9자리: ×0.75
 * 10자리: ×0.65
 * 11자리 이상: ×0.55
 */
export function amountFontSize(amount: number, base: number): number {
  const digits = Math.floor(Math.abs(amount)).toString().length;
  if (digits <= 7) return base;
  if (digits === 8) return Math.round(base * 0.875);
  if (digits === 9) return Math.round(base * 0.75);
  if (digits === 10) return Math.round(base * 0.65);
  return Math.round(base * 0.55);
}

/**
 * Unix timestamp(ms)를 "M.D HH:MM" 형태로 변환한다.
 * 지출 목록에서 날짜·시간을 간략히 표시할 때 사용한다.
 */
export const fmtTimestamp = (ts: number): string => {
  const d = new Date(ts);
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${M}.${D} ${hh}:${mm}`;
};
