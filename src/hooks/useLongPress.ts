import { useRef } from 'react';

/**
 * 길게 누르기(long press) 이벤트를 감지한다.
 * 웹(onMouseDown)과 모바일 WebView(onTouchStart) 모두 대응한다.
 *
 * @param callback - ms 이상 누르고 있을 때 실행할 콜백
 * @param ms       - 트리거 임계값 (기본값: 600ms)
 */
export function useLongPress(callback: () => void, ms = 600) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const start = () => {
    timerRef.current = setTimeout(callback, ms);
  };

  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
  };
}
