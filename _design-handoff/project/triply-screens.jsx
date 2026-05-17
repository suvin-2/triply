// Triply — screens: Home, Create, Trip (expense list), AddExpense sheet
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

// ─────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n));
const fmtCompact = (n) => {
  if (n >= 1000000) return (n/1000000).toFixed(1).replace(/\.0$/,'') + 'M';
  return fmt(n);
};

// Color helpers
const ACCENT = 'var(--accent)';
const INK = '#0A0A0A';
const MUTE = '#8C8579';
const LINE = '#E5E0D6';
const PAPER = '#F4F1EA';

// Avatar (initial circle)
function Avatar({ name, size = 28, dark = false }) {
  const initial = (name || '?').trim()[0] || '?';
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: dark ? INK : '#fff',
      border: `1px solid ${dark ? INK : INK}`,
      color: dark ? '#fff' : INK,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600,
      fontFamily: 'Pretendard',
      flexShrink: 0,
    }}>{initial}</div>
  );
}

// Avatar cluster
function AvatarStack({ names, size = 22, max = 4 }) {
  const list = names.slice(0, max);
  const more = names.length - max;
  return (
    <div style={{ display:'flex', alignItems:'center' }}>
      {list.map((n, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar name={n} size={size} dark={i % 2 === 0} />
        </div>
      ))}
      {more > 0 && (
        <div style={{
          marginLeft: -8, width: size, height: size, borderRadius: '50%',
          background: '#fff', border: `1px solid ${INK}`,
          fontSize: size * 0.36, fontWeight: 600, color: INK,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>+{more}</div>
      )}
    </div>
  );
}

// Section label (small caps)
function Caps({ children, style }) {
  return <div className="mono" style={{
    fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: MUTE, fontWeight: 500, ...style,
  }}>{children}</div>;
}

// Filled button
function PrimaryBtn({ children, onClick, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '20px 18px', background: disabled ? '#BFBAA8' : INK,
      color: '#fff', border: 'none', borderRadius: 4,
      fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'inherit', whiteSpace: 'nowrap',
      ...style,
    }}>{children}</button>
  );
}

function Chevron({ dir = 'right', size = 14, color = '#fff', stroke = 2 }) {
  const r = { right: 0, left: 180, up: -90, down: 90 }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ transform: `rotate(${r}deg)` }}>
      <path d="M5 2 L10 7 L5 12" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="square" strokeLinejoin="miter"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// 01. HOME
// ─────────────────────────────────────────────────────────────
function HomeScreen({ rooms, onOpenRoom, onCreate }) {
  const [link, setLink] = useS('');
  return (
    <div style={{
      position:'absolute', inset:0, paddingTop: 60, paddingBottom: 36,
      background: '#fff', color: INK,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Brand header */}
      <div style={{ padding: '12px 28px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: ACCENT, borderRadius: '50%' }} />
            <span className="mono" style={{ fontSize: 13, letterSpacing: '0.15em', fontWeight: 600 }}>TRIPLY</span>
          </div>
          <button style={{
            background:'none', border:'none', cursor:'pointer', padding: 4,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="4" cy="11" r="1.5" fill={INK}/><circle cx="11" cy="11" r="1.5" fill={INK}/><circle cx="18" cy="11" r="1.5" fill={INK}/></svg>
          </button>
        </div>
        <div style={{ marginTop: 28 }}>
          <h1 style={{
            fontSize: 36, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.025em',
          }}>
            안녕, <span style={{ fontWeight: 300, color: MUTE }}>제제.</span>
          </h1>
          <p style={{ fontSize: 14, color: MUTE, marginTop: 10, lineHeight: 1.5 }}>
            진행 중인 여행 <strong style={{ color: INK, fontWeight: 600 }}>1</strong>건 ·
            정산 대기 금액 <strong className="mono" style={{ color: INK, fontWeight: 600 }}>39,000원</strong>
          </p>
        </div>
      </div>

      {/* Rooms list */}
      <div style={{ padding: '0 28px', flex: 1, overflowY: 'auto' }}>
        <div style={{
          display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 14,
          paddingBottom: 10, borderBottom: `1px solid ${INK}`, gap: 12,
        }}>
          <Caps style={{ whiteSpace:'nowrap' }}>내 여행</Caps>
          <span className="mono" style={{ fontSize: 11, color: MUTE, whiteSpace:'nowrap' }}>{rooms.length} TRIPS</span>
        </div>

        {rooms.map((r, idx) => (
          <button key={r.id} onClick={() => onOpenRoom(r.id)} style={{
            width:'100%', background:'none', border:'none', textAlign:'left',
            padding: '18px 0', cursor:'pointer', display:'block',
            borderBottom: idx === rooms.length - 1 ? 'none' : `1px solid ${LINE}`,
            fontFamily: 'inherit',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
                  {r.status === 'live' && <span style={{
                    width: 6, height: 6, background: ACCENT, borderRadius:'50%',
                    display:'inline-block', flexShrink: 0,
                  }} />}
                  <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', whiteSpace:'nowrap' }}>{r.name}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
                  <span className="mono" style={{ fontSize: 11, color: MUTE, whiteSpace:'nowrap' }}>{r.dateLabel}</span>
                  <span style={{ width: 2, height: 2, background: MUTE, borderRadius: '50%' }} />
                  <AvatarStack names={r.members} size={18} max={4} />
                  {r.status === 'live'
                    ? <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600, whiteSpace:'nowrap' }}>진행중</span>
                    : <span style={{ fontSize: 11, color: MUTE, whiteSpace:'nowrap' }}>정산완료</span>}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink: 0 }}>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
                  {fmtCompact(r.expenses.reduce((s,e) => s + e.amount, 0))}
                </div>
                <div className="mono" style={{ fontSize: 10, color: MUTE, marginTop: 2 }}>KRW</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Link input + CTA */}
      <div style={{ padding: '14px 28px 0', borderTop: `1px solid ${LINE}`, background: '#fff' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 14 }}>
          <input value={link} onChange={(e) => setLink(e.target.value)}
            placeholder="초대 링크 붙여넣기"
            style={{
              flex: 1, padding: '14px 0', background: 'transparent',
              border: 'none', borderBottom: `1px solid ${INK}`,
              fontSize: 14, fontFamily: 'inherit', outline: 'none', color: INK,
            }} />
          <button style={{
            width: 44, height: 44, background: link ? INK : '#fff',
            border: `1px solid ${INK}`, color: link ? '#fff' : INK,
            cursor:'pointer', borderRadius: 4, fontSize: 18,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Chevron dir="right" size={14} color={link ? '#fff' : INK} />
          </button>
        </div>
        <PrimaryBtn onClick={onCreate}>
          <span>새 여행 만들기</span>
          <span style={{ display:'flex', alignItems:'center', gap: 6 }}>
            <span className="mono" style={{ fontSize: 12, opacity: 0.6, fontWeight: 500 }}>NEW</span>
            <Chevron dir="right" size={14} color="#fff" />
          </span>
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 02. CREATE TRIP
// ─────────────────────────────────────────────────────────────
function CreateScreen({ onBack, onCreate }) {
  const [name, setName] = useS('');
  const [start, setStart] = useS('');
  const [end, setEnd] = useS('');
  const [members, setMembers] = useS(['제제']);
  const [memberInput, setMemberInput] = useS('');

  const addMember = () => {
    const v = memberInput.trim();
    if (v && !members.includes(v)) setMembers(m => [...m, v]);
    setMemberInput('');
  };
  const removeMember = (m) => setMembers(ms => ms.filter(x => x !== m));

  const canSubmit = name.trim() && members.length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      dateLabel: start && end ? `${start} — ${end}` : (start || '날짜 미정'),
      count: members.length,
      members,
    });
  };

  return (
    <div style={{
      position:'absolute', inset:0, paddingTop: 60, paddingBottom: 36,
      background:'#fff', color: INK,
      display:'flex', flexDirection:'column',
    }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 24px 18px',
      }}>
        <button onClick={onBack} style={{
          background:'none', border:'none', cursor:'pointer', padding: 4,
          display:'flex', alignItems:'center', gap: 6, color: INK, fontFamily:'inherit', fontSize: 14,
        }}>
          <Chevron dir="left" size={14} color={INK} />
        </button>
        <Caps style={{ whiteSpace:'nowrap' }}>STEP 01 / 01</Caps>
        <div style={{ width: 22 }} />
      </div>

      {/* Big title */}
      <div style={{ padding: '4px 28px 24px' }}>
        <h2 style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 700, letterSpacing:'-0.025em' }}>
          새 여행을<br/><span style={{ fontWeight: 300, color: MUTE }}>시작해볼까요?</span>
        </h2>
      </div>

      <div style={{ padding: '0 28px', flex: 1, overflowY:'auto' }}>
        {/* Trip name */}
        <FieldGroup label="여행 이름">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="제주 3박 4일"
            style={fieldStyle()} />
        </FieldGroup>

        {/* Dates */}
        <FieldGroup label="여행 날짜">
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap: 10, alignItems:'center' }}>
            <DateChip value={start} onChange={setStart} placeholder="시작일" />
            <span style={{ color: MUTE, fontSize: 13 }}>—</span>
            <DateChip value={end} onChange={setEnd} placeholder="종료일" />
          </div>
        </FieldGroup>

        {/* Members */}
        <FieldGroup label={`인원 (${members.length}명)`}>
          <div style={{
            display:'flex', flexWrap:'wrap', gap: 6,
            padding: '8px 0 10px',
          }}>
            {members.map(m => (
              <span key={m} style={{
                display:'inline-flex', alignItems:'center', gap: 6,
                padding: '8px 10px 8px 12px',
                background: INK, color:'#fff',
                fontSize: 13, fontWeight: 500, borderRadius: 4,
              }}>
                {m}
                <button onClick={() => removeMember(m)} style={{
                  width: 16, height: 16, background:'rgba(255,255,255,0.2)',
                  border:'none', color:'#fff', cursor:'pointer',
                  borderRadius: 2, padding: 0, fontSize: 12, lineHeight: 1,
                }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 4 }}>
            <input value={memberInput} onChange={(e) => setMemberInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
              placeholder="이름 입력 후 엔터"
              style={{ ...fieldStyle(), flex: 1 }} />
            <button onClick={addMember} style={{
              padding: '14px 16px', background:'#fff',
              border: `1px solid ${INK}`, fontSize: 13, fontWeight: 600,
              cursor:'pointer', fontFamily:'inherit', borderRadius: 4,
              color: INK, whiteSpace:'nowrap',
            }}>+ 추가</button>
          </div>
        </FieldGroup>

        <div style={{ height: 20 }} />
      </div>

      <div style={{ padding:'14px 28px 0', borderTop:`1px solid ${LINE}` }}>
        <PrimaryBtn onClick={handleSubmit} disabled={!canSubmit}>
          <span>방 만들고 링크 공유</span>
          <Chevron dir="right" size={14} color="#fff" />
        </PrimaryBtn>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ paddingBottom: 22, borderBottom: `1px solid ${LINE}`, marginBottom: 22 }}>
      <Caps style={{ marginBottom: 12 }}>{label}</Caps>
      {children}
    </div>
  );
}
function fieldStyle() {
  return {
    width: '100%', padding: '14px 0', background: 'transparent',
    border: 'none', borderBottom: `1px solid ${INK}`,
    fontSize: 16, fontFamily: 'inherit', outline: 'none',
    color: INK, fontWeight: 500,
  };
}
function DateChip({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...fieldStyle(),
        padding: '12px 0',
        textAlign:'left',
        fontSize: 15,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// 03. TRIP (expense list — the main screen)
// ─────────────────────────────────────────────────────────────
function TripScreen({ room, onBack, onAdd, onSettle }) {
  if (!room) return null;
  const total = room.expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = room.members.length ? total / room.members.length : 0;
  const [filter, setFilter] = useS('전체');

  const CATS = ['전체','식사','교통','숙소','관광','기타'];
  const filtered = filter === '전체' ? room.expenses : room.expenses.filter(e => e.category === filter);

  return (
    <div style={{
      position:'absolute', inset:0, paddingTop: 56, paddingBottom: 36,
      background:'#fff', color: INK, display:'flex', flexDirection:'column',
    }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '14px 24px 12px' }}>
        <button onClick={onBack} style={{
          background:'none', border:'none', padding: 4, cursor:'pointer',
        }}><Chevron dir="left" size={14} color={INK} /></button>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, background: ACCENT, borderRadius:'50%' }} />
          <span className="mono" style={{ fontSize: 11, color: MUTE, letterSpacing:'0.1em' }}>LIVE</span>
        </div>
        <button style={{ background:'none', border:'none', padding: 4, cursor:'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="4" cy="10" r="1.5" fill={INK}/><circle cx="10" cy="10" r="1.5" fill={INK}/><circle cx="16" cy="10" r="1.5" fill={INK}/></svg>
        </button>
      </div>

      {/* Hero — trip name + stats */}
      <div style={{ padding: '6px 28px 18px' }}>
        <h2 style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 700, letterSpacing:'-0.025em' }}>
          {room.name}
        </h2>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginTop: 8 }}>
          <span className="mono" style={{ fontSize: 12, color: MUTE }}>{room.dateLabel}</span>
          <span style={{ width: 2, height: 2, background: MUTE, borderRadius:'50%' }} />
          <AvatarStack names={room.members} size={20} />
        </div>

        {/* Stats — swiss style two-column with big mono numbers */}
        <div style={{
          marginTop: 22,
          display:'grid', gridTemplateColumns:'1fr 1fr',
          borderTop: `1px solid ${INK}`,
        }}>
          <div style={{ padding: '16px 14px 16px 0', borderRight: `1px solid ${LINE}` }}>
            <Caps style={{ marginBottom: 6 }}>총 지출</Caps>
            <div className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em' }}>
              {fmt(total)}
            </div>
            <div className="mono" style={{ fontSize: 11, color: MUTE, marginTop: 2 }}>KRW · {room.expenses.length}건</div>
          </div>
          <div style={{ padding: '16px 0 16px 14px' }}>
            <Caps style={{ marginBottom: 6 }}>1인 평균</Caps>
            <div className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em' }}>
              {fmt(perPerson)}
            </div>
            <div className="mono" style={{ fontSize: 11, color: MUTE, marginTop: 2 }}>÷ {room.members.length}명</div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{
        display:'flex', gap: 6, padding: '0 28px 14px', overflowX:'auto',
        borderBottom: `1px solid ${LINE}`,
      }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '7px 12px',
            background: filter === c ? INK : 'transparent',
            color: filter === c ? '#fff' : INK,
            border: `1px solid ${filter === c ? INK : LINE}`,
            borderRadius: 4, fontSize: 12, fontWeight: 500,
            cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit',
          }}>{c}</button>
        ))}
      </div>

      {/* Expense list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 28px 100px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign:'center', color: MUTE, fontSize: 13 }}>
            아직 지출이 없어요
          </div>
        )}
        {filtered.map((e, i) => (
          <div key={e.id} style={{
            padding: '16px 0',
            borderBottom: i === filtered.length - 1 ? 'none' : `1px solid ${LINE}`,
            display:'flex', alignItems:'center', gap: 12,
          }}>
            <div style={{ width: 36, flexShrink: 0 }}>
              <Caps style={{ fontSize: 9, color: MUTE, whiteSpace:'nowrap' }}>{e.category}</Caps>
              <div className="mono" style={{ fontSize: 10, color: MUTE, marginTop: 2, whiteSpace:'nowrap' }}>
                {e.when.split(' ')[0]}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing:'-0.01em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.title}</div>
              <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 4, flexWrap:'wrap' }}>
                <Avatar name={e.payer} size={16} dark />
                <span style={{ fontSize: 11, color: MUTE, whiteSpace:'nowrap' }}>{e.payer} 결제</span>
                <span style={{ width: 2, height: 2, background: MUTE, borderRadius:'50%' }} />
                <span style={{ fontSize: 11, color: MUTE, whiteSpace:'nowrap' }}>{e.participants.length}명 분담</span>
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
                {fmt(e.amount)}
              </div>
              <div className="mono" style={{ fontSize: 10, color: MUTE, marginTop: 2, whiteSpace:'nowrap' }}>
                / {fmt(e.amount / e.participants.length)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB + CTA bar */}
      <div style={{
        position:'absolute', left: 0, right: 0, bottom: 36,
        display:'flex', gap: 0, padding: '0 28px',
      }}>
        <button onClick={onAdd} style={{
          width: 60, height: 60, background: ACCENT, color:'#fff',
          border:'none', borderRadius: 4, cursor:'pointer',
          fontSize: 28, fontWeight: 300, marginRight: 8,
          fontFamily: 'inherit', display:'flex', alignItems:'center', justifyContent:'center',
          lineHeight: 1,
        }}>+</button>
        <button onClick={onSettle} style={{
          flex: 1, background: INK, color:'#fff', border:'none', borderRadius: 4,
          fontSize: 15, fontWeight: 600, cursor:'pointer', fontFamily:'inherit',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 22px', whiteSpace:'nowrap',
        }}>
          <span>정산하기</span>
          <span style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="mono" style={{ fontSize: 12, opacity: 0.55, fontWeight: 500 }}>{room.members.length}명</span>
            <Chevron dir="right" size={14} color="#fff" />
          </span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 04. ADD EXPENSE — bottom sheet
// ─────────────────────────────────────────────────────────────
function AddExpenseSheet({ room, onClose, onSubmit, instant = false, defaults }) {
  const [title, setTitle] = useS(defaults?.title || '');
  const [amount, setAmount] = useS(defaults?.amount ? String(defaults.amount) : '');
  const [payer, setPayer] = useS(defaults?.payer || room.members[0]);
  const [participants, setParticipants] = useS(defaults?.participants || [...room.members]);
  const [category, setCategory] = useS(defaults?.category || '식사');

  const numAmount = parseInt(amount || '0', 10) || 0;
  const perPerson = participants.length ? numAmount / participants.length : 0;
  const canSubmit = title.trim() && numAmount > 0 && participants.length > 0;

  const toggleP = (m) => {
    setParticipants(ps => ps.includes(m) ? ps.filter(x => x !== m) : [...ps, m]);
  };
  const allOn = participants.length === room.members.length;
  const toggleAll = () => setParticipants(allOn ? [] : [...room.members]);

  // Custom keypad input
  const press = (k) => {
    if (k === 'del') return setAmount(a => a.slice(0, -1));
    if (k === '00') return setAmount(a => (a === '' ? '' : a + '00'));
    setAmount(a => (a + k).replace(/^0+/, '') || '0');
  };

  const [animOn, setAnimOn] = useS(instant);
  useE(() => {
    if (instant) return;
    const t = setTimeout(() => setAnimOn(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      amount: numAmount,
      payer,
      participants,
      category,
      when: '오늘',
    });
  };

  const CATS = ['식사','교통','숙소','관광','기타'];

  return (
    <div style={{
      position:'absolute', inset:0, zIndex: 50,
      background: animOn ? 'rgba(10,10,10,0.4)' : 'rgba(10,10,10,0)',
      transition: 'background 240ms ease',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position:'absolute', left: 0, right: 0, bottom: 0,
        height: '88%',
        background:'#fff', color: INK,
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        transform: animOn ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 320ms cubic-bezier(0.2, 0.7, 0.2, 1)',
        display:'flex', flexDirection:'column',
        overflow:'hidden',
      }}>
        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: '#D6D0C2', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: '8px 24px 18px',
          borderBottom: `1px solid ${INK}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <Caps>NEW</Caps>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing:'-0.02em' }}>지출 추가</span>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, background:'none', border: 'none',
            cursor:'pointer', padding: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 2L16 16M16 2L2 16" stroke={INK} strokeWidth="1.6"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY:'auto', padding: '0 24px' }}>
          {/* Amount — hero numeric display */}
          <div style={{ padding: '28px 0 8px', textAlign:'center' }}>
            <div className="mono" style={{
              fontSize: 56, fontWeight: 700, letterSpacing: '-0.05em',
              color: numAmount === 0 ? '#C8C2B3' : INK,
              lineHeight: 1,
            }}>
              {numAmount === 0 ? '0' : fmt(numAmount)}
              <span style={{ fontSize: 22, fontWeight: 500, color: MUTE, marginLeft: 4 }}>원</span>
            </div>
            {participants.length > 0 && numAmount > 0 && (
              <div className="mono" style={{ marginTop: 14, fontSize: 12, color: MUTE }}>
                1인당 <span style={{ color: INK, fontWeight: 600 }}>{fmt(perPerson)}</span>원
              </div>
            )}
          </div>

          {/* Title input */}
          <div style={{ padding: '16px 0 14px', borderBottom: `1px solid ${LINE}` }}>
            <Caps style={{ marginBottom: 8 }}>항목명</Caps>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="흑돼지, 렌터카, 숙소..."
              style={{
                width: '100%', border:'none', outline:'none', fontFamily:'inherit',
                fontSize: 18, fontWeight: 600, color: INK, padding: '4px 0',
                background: 'transparent',
              }} />
          </div>

          {/* Category */}
          <div style={{ padding: '16px 0 14px', borderBottom: `1px solid ${LINE}` }}>
            <Caps style={{ marginBottom: 10 }}>카테고리</Caps>
            <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: '8px 12px',
                  background: category === c ? INK : 'transparent',
                  color: category === c ? '#fff' : INK,
                  border: `1px solid ${category === c ? INK : LINE}`,
                  borderRadius: 4, fontSize: 13, fontWeight: 500,
                  cursor:'pointer', fontFamily:'inherit',
                }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Payer — single select avatars */}
          <div style={{ padding: '16px 0 14px', borderBottom: `1px solid ${LINE}` }}>
            <Caps style={{ marginBottom: 10 }}>결제한 사람</Caps>
            <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
              {room.members.map(m => {
                const on = payer === m;
                return (
                  <button key={m} onClick={() => setPayer(m)} style={{
                    display:'inline-flex', alignItems:'center', gap: 8,
                    padding: '8px 14px 8px 8px',
                    background: on ? INK : 'transparent',
                    color: on ? '#fff' : INK,
                    border: `1px solid ${on ? INK : LINE}`,
                    borderRadius: 4, fontSize: 14, fontWeight: 600,
                    cursor:'pointer', fontFamily:'inherit',
                  }}>
                    <Avatar name={m} size={22} dark={!on} />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Participants — multi toggle */}
          <div style={{ padding: '16px 0 24px' }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10,
            }}>
              <Caps>참여 인원 ({participants.length}/{room.members.length})</Caps>
              <button onClick={toggleAll} style={{
                background:'none', border:'none', padding: 0, cursor:'pointer',
                fontFamily:'inherit', fontSize: 12, fontWeight: 600,
                color: ACCENT,
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                {allOn ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
              {room.members.map(m => {
                const on = participants.includes(m);
                return (
                  <button key={m} onClick={() => toggleP(m)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding: '14px 14px',
                    background: on ? INK : '#fff',
                    color: on ? '#fff' : INK,
                    border: `1px solid ${on ? INK : LINE}`,
                    borderRadius: 4, cursor:'pointer', fontFamily:'inherit',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                      <Avatar name={m} size={22} dark={!on} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{m}</span>
                    </div>
                    <span style={{
                      width: 18, height: 18, borderRadius: 2,
                      border: `1.5px solid ${on ? '#fff' : LINE}`,
                      background: on ? '#fff' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {on && <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 5 L4.5 8.5 L11 1.5" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="square"/></svg>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Custom numeric keypad */}
        <div style={{ borderTop: `1px solid ${INK}`, padding: '12px 12px 0', background: '#FAF8F2' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 4 }}>
            {['1','2','3','4','5','6','7','8','9','00','0','del'].map(k => (
              <button key={k} onClick={() => press(k)} style={{
                padding: '14px 0', background: 'transparent', border: 'none',
                fontFamily:"'JetBrains Mono', monospace",
                fontSize: 22, fontWeight: 500, cursor:'pointer',
                color: INK,
              }}>
                {k === 'del'
                  ? <svg width="22" height="16" viewBox="0 0 22 16" style={{display:'inline-block', verticalAlign:'middle'}}><path d="M7 1h13a2 2 0 012 2v10a2 2 0 01-2 2H7L1 8 7 1z" fill="none" stroke={INK} strokeWidth="1.4"/><path d="M10 5l6 6M16 5l-6 6" stroke={INK} strokeWidth="1.4" strokeLinecap="square"/></svg>
                  : k}
              </button>
            ))}
          </div>
        </div>

        {/* Submit bar */}
        <div style={{ padding:'8px 12px 12px', background:'#FAF8F2' }}>
          <PrimaryBtn onClick={handleSubmit} disabled={!canSubmit} style={{ borderRadius: 4 }}>
            <span>{canSubmit ? `${fmt(numAmount)}원 추가하기` : '항목명 · 금액 입력'}</span>
            <Chevron dir="right" size={14} color="#fff" />
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, CreateScreen, TripScreen, AddExpenseSheet,
  Avatar, AvatarStack, Caps, PrimaryBtn, Chevron, fmt, fmtCompact,
});
