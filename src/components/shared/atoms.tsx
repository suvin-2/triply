import type { CSSProperties, ReactNode } from 'react';

// ─── Caps ─────────────────────────────────────────────────────
/** 대문자·모노 소제목 레이블. 섹션 구분에 사용한다. */
export function Caps({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#8C8579',
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── PrimaryBtn ───────────────────────────────────────────────
/** 전체 너비 검정 버튼. disabled 시 배경이 흐려진다. */
export function PrimaryBtn({
  children,
  onClick,
  style,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '20px 18px',
        background: disabled ? '#BFBAA8' : '#0A0A0A',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Chevron ──────────────────────────────────────────────────
/** 방향 화살표 SVG. dir로 회전 방향을 지정한다. */
export function Chevron({
  dir = 'right',
  size = 14,
  color = '#fff',
  stroke = 2,
}: {
  dir?: 'right' | 'left' | 'up' | 'down';
  size?: number;
  color?: string;
  stroke?: number;
}) {
  const deg = { right: 0, left: 180, up: -90, down: 90 }[dir];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      style={{ transform: `rotate(${deg}deg)`, flexShrink: 0 }}
    >
      <path
        d="M5 2 L10 7 L5 12"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────
/** 이름 첫 글자를 원형으로 표시하는 아바타. dark=true이면 검정 배경. */
export function Avatar({
  name,
  size = 28,
  dark = false,
}: {
  name: string;
  size?: number;
  dark?: boolean;
}) {
  const initial = (name || '?').trim()[0] ?? '?';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: dark ? '#0A0A0A' : '#fff',
        border: '1px solid #0A0A0A',
        color: dark ? '#fff' : '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 600,
        flexShrink: 0,
        fontFamily: 'Pretendard, sans-serif',
      }}
    >
      {initial}
    </div>
  );
}

// ─── AvatarStack ──────────────────────────────────────────────
/**
 * 여러 아바타를 겹쳐서 표시한다.
 * max를 초과하면 "+n" 말줄임 아바타를 추가한다.
 */
export function AvatarStack({
  names,
  size = 22,
  max = 4,
}: {
  names: string[];
  size?: number;
  max?: number;
}) {
  const list = names.slice(0, max);
  const overflow = names.length - max;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {list.map((n, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar name={n} size={size} dark={i % 2 === 0} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            marginLeft: -8,
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#fff',
            border: '1px solid #0A0A0A',
            fontSize: size * 0.36,
            fontWeight: 600,
            color: '#0A0A0A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
