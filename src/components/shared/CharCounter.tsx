import s from './CharCounter.module.scss';

interface Props {
  current: number;
  max: number;
}

/**
 * 입력 필드 하단에 현재/최대 글자수를 표시한다.
 * 80% 이상이면 주황, 100%이면 빨간색으로 경고한다.
 */
export default function CharCounter({ current, max }: Props) {
  const ratio = max > 0 ? current / max : 0;
  const colorClass =
    ratio >= 1 ? s.danger : ratio >= 0.8 ? s.warn : s.mute;

  return (
    <span className={`${s.counter} ${colorClass}`}>
      {current}/{max}
    </span>
  );
}
