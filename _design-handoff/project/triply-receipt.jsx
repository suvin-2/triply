// Triply — 05 Settlement screen + the receipt card showpiece

const { useState: useSS, useEffect: useSE, useMemo: useSM, useRef: useSR } = React;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const _INK = '#0A0A0A';
const _MUTE = '#8C8579';
const _LINE = '#E5E0D6';

const _fmt = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n));

// Random-looking but deterministic bars for the barcode
function barcodePattern(seed = 'triply') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars = [];
  for (let i = 0; i < 56; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const w = 1 + (h % 4); // 1..4 px wide
    const fill = (h >>> 4) & 1;
    bars.push({ w, fill });
  }
  return bars;
}

// Serrated edge (zigzag) as inline SVG
function SerratedEdge({ flip = false, color = '#FBF8F1', shadow = false }) {
  const teeth = 24;
  const w = 100 / teeth;
  let d = `M0,${flip ? 0 : 8} `;
  for (let i = 0; i < teeth; i++) {
    const x1 = i * w;
    const x2 = x1 + w / 2;
    const x3 = x1 + w;
    if (flip) {
      d += `L${x2},8 L${x3},0 `;
    } else {
      d += `L${x2},0 L${x3},8 `;
    }
  }
  d += flip ? `L100,0 L0,0 Z` : `L100,8 L0,8 Z`;
  return (
    <svg viewBox="0 0 100 8" preserveAspectRatio="none" style={{
      width: '100%', height: 12, display: 'block',
      transform: flip ? 'translateY(-1px)' : 'translateY(1px)',
      filter: shadow ? 'drop-shadow(0 1px 0 rgba(0,0,0,0.04))' : 'none',
    }}>
      <path d={d} fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Receipt Card — the shareable showpiece
// ─────────────────────────────────────────────────────────────
function ReceiptCard({ room, transfers, showTexture = true, compact = false }) {
  const total = room.expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = room.members.length ? total / room.members.length : 0;
  const today = new Date();
  const orderNo = String(Math.abs((room.id || 'trip').split('').reduce((s,c) => s*31 + c.charCodeAt(0), 0)) % 9999).padStart(4, '0');
  const bars = barcodePattern(room.id || room.name);

  const cardStyle = {
    width: '100%',
    background: '#FBF8F1',
    color: _INK,
    fontFamily: "'JetBrains Mono', monospace",
    position: 'relative',
    overflow: 'hidden',
    ...(showTexture ? {} : { background: '#FFFFFF' }),
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Top serrated edge */}
      <SerratedEdge flip={false} color={showTexture ? '#FBF8F1' : '#FFFFFF'} />
      <div className={showTexture ? 'paper' : ''} style={cardStyle}>
        <div style={{ padding: '20px 22px 6px' }}>
          {/* Brand */}
          <div style={{ textAlign:'center', marginBottom: 14 }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap: 7, padding: '4px 10px',
              border: `1.5px solid ${_INK}`, borderRadius: 2,
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius:'50%' }} />
              <span style={{ fontSize: 11, letterSpacing: '0.2em', fontWeight: 700 }}>TRIPLY</span>
            </div>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', marginTop: 10, color: _MUTE }}>
              ★ ★ ★&nbsp;&nbsp;TRIP RECEIPT&nbsp;&nbsp;★ ★ ★
            </div>
          </div>

          {/* Trip title */}
          <div style={{ textAlign:'center', paddingBottom: 12 }}>
            <div style={{
              fontFamily: 'Pretendard, sans-serif',
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>{room.name}</div>
            <div style={{ fontSize: 10, marginTop: 6, color: _MUTE, letterSpacing: '0.08em' }}>
              {room.dateLabel.toUpperCase()}
            </div>
          </div>

          {/* Order info */}
          <div style={{
            fontSize: 10, lineHeight: 1.7, paddingTop: 12, paddingBottom: 12,
            borderTop: `1px dashed ${_INK}`,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>ORDER #{orderNo}</span>
              <span>{today.toLocaleDateString('en-CA').replace(/-/g,'.')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>PARTY OF</span><span>{room.members.length}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>SERVED BY</span><span>TRIPLY ✦</span>
            </div>
          </div>

          {/* Items table */}
          <div style={{ borderTop: `1px dashed ${_INK}`, paddingTop: 10, paddingBottom: 10 }}>
            <div style={{
              display:'grid', gridTemplateColumns: '24px 1fr auto', gap: 8,
              fontSize: 9, color: _MUTE, paddingBottom: 8,
              borderBottom: `1px dotted ${_LINE}`,
              letterSpacing: '0.08em',
            }}>
              <span>QTY</span><span>ITEM</span><span style={{ textAlign:'right' }}>AMOUNT</span>
            </div>
            {room.expenses.map((e, i) => (
              <div key={e.id} style={{
                display:'grid', gridTemplateColumns: '24px 1fr auto', gap: 8,
                fontSize: 11, paddingTop: 7, alignItems:'baseline',
              }}>
                <span style={{ color: _MUTE }}>{String(i+1).padStart(2,'0')}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{e.title.toUpperCase()}</div>
                  <div style={{ fontSize: 9, color: _MUTE, marginTop: 2, letterSpacing: '0.04em' }}>
                    BY {e.payer.toUpperCase()} · {e.participants.length}P
                  </div>
                </div>
                <span style={{ textAlign:'right', fontWeight: 700 }}>{_fmt(e.amount)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{
            borderTop: `1px dashed ${_INK}`, paddingTop: 10, paddingBottom: 10,
            fontSize: 11,
          }}>
            <Row label="ITEM COUNT" value={String(room.expenses.length).padStart(2,'0')} />
            <Row label="SUBTOTAL" value={_fmt(total)} />
            <Row label="TAX" value="0" />
            <div style={{ borderTop: `1.5px solid ${_INK}`, marginTop: 8, paddingTop: 8 }}>
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'baseline',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>TOTAL</span>
                <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  ₩{_fmt(total)}
                </span>
              </div>
              <div style={{
                display:'flex', justifyContent:'space-between', fontSize: 10,
                color: _MUTE, marginTop: 4,
              }}>
                <span>PER PERSON</span>
                <span>₩{_fmt(perPerson)}</span>
              </div>
            </div>
          </div>

          {/* Settlement section */}
          <div style={{
            borderTop: `1px dashed ${_INK}`, paddingTop: 10, paddingBottom: 10,
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.15em', color: _MUTE, marginBottom: 8 }}>
              ✦ SETTLEMENT TRANSFERS ✦
            </div>
            {transfers.length === 0 ? (
              <div style={{ fontSize: 11, textAlign:'center', padding: '6px 0', color: _MUTE }}>
                ALL EVEN — NO TRANSFERS NEEDED
              </div>
            ) : transfers.map((t, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'baseline',
                fontSize: 11, paddingTop: 5,
              }}>
                <span>
                  <span style={{ fontWeight: 700 }}>{t.from}</span>
                  <span style={{ color: _MUTE, margin: '0 6px' }}>→</span>
                  <span style={{ fontWeight: 700 }}>{t.to}</span>
                </span>
                <span style={{ fontWeight: 700 }}>{_fmt(t.amount)}</span>
              </div>
            ))}
          </div>

          {/* Auth */}
          <div style={{
            borderTop: `1px dashed ${_INK}`, paddingTop: 10,
            fontSize: 10, lineHeight: 1.8,
          }}>
            <div>AUTH ........ {orderNo}-{String(today.getMonth()+1).padStart(2,'0')}{String(today.getDate()).padStart(2,'0')}</div>
            <div>METHOD ...... TOSS · KAKAOPAY · CASH</div>
            <div>STATUS ...... <span style={{ background: _INK, color:'#FBF8F1', padding: '1px 6px' }}>SETTLED</span></div>
          </div>

          {/* Thank you */}
          <div style={{
            textAlign:'center', padding: '16px 0 10px',
            fontSize: 10, letterSpacing: '0.15em',
          }}>
            ━━━━━ THANK YOU ━━━━━<br/>
            <span style={{ color: _MUTE }}>FOR A GREAT TRIP</span>
          </div>

          {/* Barcode */}
          <div style={{ paddingBottom: 6 }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap: 1, height: 44, justifyContent:'center' }}>
              {bars.map((b, i) => (
                <div key={i} style={{
                  width: b.w, height: '100%',
                  background: b.fill ? _INK : 'transparent',
                }} />
              ))}
            </div>
            <div style={{ textAlign:'center', fontSize: 9, marginTop: 4, letterSpacing: '0.3em' }}>
              TRIPLY-{orderNo}
            </div>
          </div>
        </div>
      </div>
      {/* Bottom serrated edge */}
      <SerratedEdge flip={true} color={showTexture ? '#FBF8F1' : '#FFFFFF'} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', fontSize: 11, paddingTop: 4,
    }}>
      <span style={{ color: _MUTE }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SettleScreen — main 05 screen
// ─────────────────────────────────────────────────────────────
function SettleScreen({ room, tweaks, onBack, onComplete, initialTab = 'list' }) {
  if (!room) return null;

  const [tab, setTab] = useSS(initialTab);   // 'list' | 'card'
  const [shareOpen, setShareOpen] = useSS(false);
  const [storyMode, setStoryMode] = useSS(false);

  const { transfers } = useSM(() => window.calcSettlement(room.members, room.expenses), [room]);
  const total = room.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{
      position:'absolute', inset: 0, paddingTop: 56, paddingBottom: 36,
      background:'#fff', display:'flex', flexDirection:'column',
    }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '14px 24px 12px' }}>
        <button onClick={onBack} style={{
          background:'none', border:'none', padding: 4, cursor:'pointer',
        }}><window.Chevron dir="left" size={14} color={_INK} /></button>
        <window.Caps style={{ whiteSpace:'nowrap' }}>05 / 정산 결과</window.Caps>
        <div style={{ width: 22 }} />
      </div>

      {/* Hero stat */}
      <div style={{ padding: '6px 28px 18px' }}>
        <h2 style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 700, letterSpacing:'-0.025em' }}>
          정산 끝났어요.
        </h2>
        <p style={{ fontSize: 14, color: _MUTE, marginTop: 8, lineHeight: 1.5 }}>
          총 <span className="mono" style={{ color: _INK, fontWeight: 700 }}>{_fmt(total)}원</span>을
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}> {transfers.length}번의 송금</span>으로 끝내요.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{
        margin: '0 28px 16px', display:'flex',
        border: `1px solid ${_INK}`, borderRadius: 4, padding: 3,
      }}>
        {[['list','송금 내역'],['card','영수증 카드']].map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: '10px 0',
            background: tab === k ? _INK : 'transparent',
            color: tab === k ? '#fff' : _INK,
            border:'none', fontSize: 13, fontWeight: 600,
            cursor:'pointer', fontFamily:'inherit', borderRadius: 2,
          }}>{label}</button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 130px' }}>
        {tab === 'list' && (
          <div>
            {transfers.length === 0 && (
              <div style={{ padding: '60px 0', textAlign:'center', color: _MUTE }}>
                모두 정산되었어요
              </div>
            )}
            {transfers.map((t, i) => (
              <div key={i} style={{
                padding: '18px 0',
                borderBottom: i === transfers.length - 1 ? 'none' : `1px solid ${_LINE}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10, marginBottom: 12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 6, flexShrink: 0, minWidth: 0 }}>
                    <window.Avatar name={t.from} size={28} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: _INK, whiteSpace:'nowrap' }}>{t.from}</span>
                    <svg width="22" height="10" viewBox="0 0 22 10" style={{ margin: '0 4px', flexShrink: 0 }}>
                      <path d="M0 5 L20 5 M16 1 L20 5 L16 9" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                    </svg>
                    <window.Avatar name={t.to} size={28} dark />
                    <span style={{ fontSize: 14, fontWeight: 600, color: _INK, whiteSpace:'nowrap' }}>{t.to}</span>
                  </div>
                  <div style={{ textAlign:'right', flexShrink: 0 }}>
                    <span className="mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
                      {_fmt(t.amount)}
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: _MUTE, fontWeight: 500, marginLeft: 3 }}>원</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap: 6 }}>
                  <button style={payBtn(true)}>
                    <span style={{
                      width: 12, height: 12, background:'#0064FF',
                      display:'inline-block', borderRadius: 2,
                    }} />
                    토스로 송금
                  </button>
                  <button style={payBtn(false)}>
                    <span style={{
                      width: 12, height: 12, background:'#FEE500',
                      display:'inline-block', borderRadius: 2,
                    }} />
                    카카오페이
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'card' && (
          <div>
            <div style={{
              padding: '4px 0 14px',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <window.Caps>SHAREABLE</window.Caps>
              <button onClick={() => setStoryMode(s => !s)} style={{
                background:'none', border: `1px solid ${_LINE}`, fontFamily:'inherit',
                fontSize: 11, color: _INK, padding: '6px 10px', cursor:'pointer', borderRadius: 4,
              }}>
                {storyMode ? '카드만 보기' : '스토리 미리보기'}
              </button>
            </div>

            {storyMode ? (
              <StoryPreview room={room} transfers={transfers} showTexture={tweaks.showReceiptTexture} />
            ) : (
              <ReceiptCard room={room} transfers={transfers} showTexture={tweaks.showReceiptTexture} />
            )}

            <div style={{ marginTop: 18, fontSize: 11, color: _MUTE, lineHeight: 1.6, textAlign:'center' }}>
              저장 또는 공유하면 카카오톡 · 인스타그램 스토리에<br/>그대로 올릴 수 있어요.
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div style={{
        position:'absolute', left: 0, right: 0, bottom: 36,
        padding: '12px 28px 0',
        background:'#fff', borderTop: `1px solid ${_LINE}`,
      }}>
        {tab === 'list' ? (
          <>
            <button onClick={() => setTab('card')} style={{
              width: '100%', padding: '18px',
              background: _INK, color:'#fff', border:'none',
              fontSize: 15, fontWeight: 600, cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              borderRadius: 4,
            }}>
              <span>영수증 카드로 공유하기</span>
              <window.Chevron dir="right" size={14} color="#fff" />
            </button>
            <button onClick={onComplete} style={{
              width:'100%', padding: '12px 0', marginTop: 8,
              background:'transparent', border: 'none', cursor:'pointer',
              fontFamily:'inherit', fontSize: 12, color: _MUTE,
              textDecoration:'underline', textUnderlineOffset: 3,
            }}>정산 완료로 표시하기</button>
          </>
        ) : (
          <div style={{ display:'flex', gap: 8 }}>
            <button style={{
              flex: 1, padding: '16px', background:'#fff', color: _INK,
              border: `1px solid ${_INK}`, fontSize: 14, fontWeight: 600,
              cursor:'pointer', fontFamily:'inherit', borderRadius: 4,
              display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
              whiteSpace:'nowrap',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1 V9 M3 6 L7 10 L11 6 M2 12 L12 12" stroke={_INK} strokeWidth="1.5" fill="none"/></svg>
              이미지 저장
            </button>
            <button onClick={() => setShareOpen(true)} style={{
              flex: 1, padding: '16px', background: _INK, color:'#fff',
              border:'none', fontSize: 14, fontWeight: 600, cursor:'pointer',
              fontFamily:'inherit', borderRadius: 4,
              display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
              whiteSpace:'nowrap',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1 V9 M3 5 L7 1 L11 5 M2 9 V12 H12 V9" stroke="#fff" strokeWidth="1.5" fill="none"/></svg>
              공유하기
            </button>
          </div>
        )}
      </div>

      {shareOpen && <ShareSheet onClose={() => setShareOpen(false)} />}
    </div>
  );
}

function payBtn(primary) {
  return {
    flex: 1, padding: '10px 6px',
    background: '#fff', color: _INK,
    border: `1px solid ${_LINE}`, fontSize: 12, fontWeight: 600,
    fontFamily:'inherit', cursor:'pointer', borderRadius: 4,
    display:'flex', alignItems:'center', justifyContent:'center', gap: 6,
    whiteSpace:'nowrap',
  };
}

// Instagram-story preview frame
function StoryPreview({ room, transfers, showTexture }) {
  return (
    <div style={{
      position:'relative',
      background:'#0A0A0A',
      padding: '40px 22px',
      borderRadius: 4,
      overflow:'hidden',
    }}>
      {/* deco corner marks */}
      <span style={cornerStyle('tl')} />
      <span style={cornerStyle('tr')} />
      <span style={cornerStyle('bl')} />
      <span style={cornerStyle('br')} />
      <div style={{
        textAlign:'center', color:'#fff',
        fontSize: 10, letterSpacing: '0.25em', marginBottom: 16, fontFamily:'JetBrains Mono',
      }}>
        ✦ TRIPLY · {room.name.toUpperCase()} ✦
      </div>
      <div style={{ transform: 'rotate(-2deg)' }}>
        <ReceiptCard room={room} transfers={transfers} showTexture={showTexture} compact />
      </div>
      <div style={{
        textAlign:'center', color:'rgba(255,255,255,0.5)',
        fontSize: 10, marginTop: 16, fontFamily:'JetBrains Mono', letterSpacing: '0.2em',
      }}>
        @ TRIPLY.KR
      </div>
    </div>
  );
}
function cornerStyle(pos) {
  const s = 14;
  const o = 12;
  const map = {
    tl: { top: o, left: o, borderTop: '1px solid #fff', borderLeft: '1px solid #fff' },
    tr: { top: o, right: o, borderTop: '1px solid #fff', borderRight: '1px solid #fff' },
    bl: { bottom: o, left: o, borderBottom: '1px solid #fff', borderLeft: '1px solid #fff' },
    br: { bottom: o, right: o, borderBottom: '1px solid #fff', borderRight: '1px solid #fff' },
  };
  return { position:'absolute', width: s, height: s, ...map[pos] };
}

// Share sheet bottom modal
function ShareSheet({ onClose }) {
  const [on, setOn] = useSS(false);
  useSE(() => { const t = setTimeout(() => setOn(true), 10); return () => clearTimeout(t); }, []);
  const targets = [
    { name:'카카오톡', color:'#FEE500' },
    { name:'인스타그램', color:'#E4405F' },
    { name:'메시지', color:'#34C759' },
    { name:'복사', color:'#0A0A0A' },
  ];
  return (
    <div style={{
      position:'absolute', inset:0, zIndex: 60,
      background: on ? 'rgba(10,10,10,0.4)' : 'transparent',
      transition: 'background 240ms',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position:'absolute', left: 0, right: 0, bottom: 0,
        background:'#fff', borderTop: `1px solid ${_INK}`,
        padding: '14px 24px 36px',
        transform: on ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1)',
      }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom: 8 }}>
          <div style={{ width: 40, height: 4, background:'#D6D0C2', borderRadius: 2 }} />
        </div>
        <window.Caps style={{ marginBottom: 14 }}>공유하기</window.Caps>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 8 }}>
          {targets.map(t => (
            <button key={t.name} style={{
              padding: '12px 0', background:'#fff',
              border: `1px solid ${_LINE}`, cursor:'pointer',
              fontFamily:'inherit', display:'flex',
              flexDirection:'column', alignItems:'center', gap: 6,
              borderRadius: 4,
            }}>
              <span style={{ width: 28, height: 28, background: t.color, borderRadius: 4 }} />
              <span style={{ fontSize: 11, color: _INK }}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SettleScreen, ReceiptCard });
