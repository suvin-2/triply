/**
 * 환경에 따라 로그 출력을 제어하는 경량 로거.
 * 프로덕션 빌드에서는 debug 출력이 트리쉐이킹으로 제거된다.
 */
const isDev = import.meta.env.DEV;

/**
 * 개발 환경에서만 디버그 로그를 출력한다.
 * 프로덕션 빌드에서는 no-op.
 *
 * @param args - 출력할 값 (console.log와 동일한 시그니처)
 */
export function debug(...args: unknown[]): void {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

/**
 * 복구 불가능한 에러를 기록한다. 모든 환경에서 출력.
 *
 * @param context - 에러 발생 위치 식별자 (예: '[useRoom]')
 * @param error - 에러 객체 또는 메시지
 * @param extra - 추가 컨텍스트 데이터
 */
export function logError(context: string, error: unknown, ...extra: unknown[]): void {
  // TODO: 프로덕션에서 Sentry 등 외부 모니터링으로 전송
  console.error(context, error, ...extra);
}
