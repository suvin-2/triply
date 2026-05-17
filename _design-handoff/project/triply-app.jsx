// Triply — main app: state + screen routing
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─────────────────────────────────────────────────────────────
// Demo data
// ─────────────────────────────────────────────────────────────
const MEMBERS_SEED = ['제제', '민지', '수현'];
const EXPENSES_SEED = [
  { id: 1, title: '흑돼지 저녁',  amount: 85000,  payer: '제제', participants: ['제제','민지','수현'], category: '식사', when: '5.10 19:42' },
  { id: 2, title: '렌터카 3일',   amount: 120000, payer: '민지', participants: ['제제','민지','수현'], category: '교통', when: '5.10 09:15' },
  { id: 3, title: '카페 (브런치)', amount: 16000,  payer: '수현', participants: ['제제','수현'],       category: '식사', when: '5.11 11:08' },
  { id: 4, title: '오설록 티뮤지엄', amount: 24000, payer: '제제', participants: ['제제','민지','수현'], category: '관광', when: '5.11 14:30' },
  { id: 5, title: '게스트하우스 2박', amount: 142000, payer: '민지', participants: ['제제','민지','수현'], category: '숙소', when: '5.10 16:00' },
];

const ROOMS_SEED = [
  { id: 'jeju', name: '제주 3박 4일', dateLabel: '5.10 — 5.13', count: 3, status: 'live',  members: MEMBERS_SEED, expenses: EXPENSES_SEED },
  { id: 'busan', name: '부산 당일치기', dateLabel: '4.20',        count: 4, status: 'done', members: ['지훈','은아','태경','보라'], expenses: [
      { id:1, title:'돼지국밥', amount:36000, payer:'지훈', participants:['지훈','은아','태경','보라'], category:'식사', when:'4.20 12:00' },
      { id:2, title:'KTX 왕복',  amount:240000, payer:'태경', participants:['지훈','은아','태경','보라'], category:'교통', when:'4.20 08:00' },
  ]},
  { id: 'gyeongju', name: '경주 1박 2일', dateLabel: '3.14 — 3.15', count: 2, status: 'done', members: ['지훈','보라'], expenses: [
      { id:1, title:'한정식', amount:64000, payer:'지훈', participants:['지훈','보라'], category:'식사', when:'3.14 18:30' },
  ]},
];

// ─────────────────────────────────────────────────────────────
// Settlement algorithm — greedy minimization
// ─────────────────────────────────────────────────────────────
function calcSettlement(members, expenses) {
  const balance = {};
  members.forEach(m => balance[m] = 0);
  expenses.forEach(e => {
    balance[e.payer] += e.amount;
    const share = e.amount / e.participants.length;
    e.participants.forEach(p => balance[p] -= share);
  });
  // Round to nearest 100원
  Object.keys(balance).forEach(k => balance[k] = Math.round(balance[k] / 100) * 100);

  const creditors = [];
  const debtors = [];
  Object.entries(balance).forEach(([name, bal]) => {
    if (bal > 0) creditors.push({ name, amount: bal });
    else if (bal < 0) debtors.push({ name, amount: -bal });
  });
  creditors.sort((a,b) => b.amount - a.amount);
  debtors.sort((a,b) => b.amount - a.amount);

  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0) transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }
  return { transfers, balance };
}

// ─────────────────────────────────────────────────────────────
// Root app
// ─────────────────────────────────────────────────────────────
function TriplyApp() {
  const TWEAKS = /*EDITMODE-BEGIN*/{
    "accent": "#E84F2C",
    "showReceiptTexture": true
  }/*EDITMODE-END*/;
  const [t, setTweak] = window.useTweaks(TWEAKS);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
  }, [t.accent]);

  // navigation
  const [screen, setScreen] = useState('home');     // 'home' | 'create' | 'trip' | 'settle'
  const [addOpen, setAddOpen] = useState(false);    // bottom sheet
  const [activeRoomId, setActiveRoomId] = useState('jeju');
  const [createCtx, setCreateCtx] = useState(null); // 'fromHome'

  // app data
  const [rooms, setRooms] = useState(ROOMS_SEED);
  const activeRoom = useMemo(() => rooms.find(r => r.id === activeRoomId), [rooms, activeRoomId]);

  // CRUD helpers
  const updateRoom = useCallback((id, patch) => {
    setRooms(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);
  const addExpense = useCallback((roomId, expense) => {
    setRooms(rs => rs.map(r => r.id === roomId
      ? { ...r, expenses: [{ ...expense, id: Date.now() }, ...r.expenses] }
      : r));
  }, []);
  const addRoom = useCallback((room) => {
    setRooms(rs => [{ ...room, id: 'r-' + Date.now() }, ...rs]);
    return 'r-' + Date.now();
  }, []);
  const completeRoom = useCallback((id) => {
    setRooms(rs => rs.map(r => r.id === id ? { ...r, status: 'done' } : r));
  }, []);

  // wire screen jumper
  useEffect(() => {
    const handler = (e) => {
      const btn = e.target.closest('[data-jump]');
      if (!btn) return;
      const j = btn.dataset.jump;
      if (j === 'home') { setScreen('home'); setAddOpen(false); }
      if (j === 'create') { setScreen('create'); setCreateCtx('fromHome'); setAddOpen(false); }
      if (j === 'trip') { setScreen('trip'); setActiveRoomId('jeju'); setAddOpen(false); }
      if (j === 'add') { setScreen('trip'); setActiveRoomId('jeju'); setAddOpen(true); }
      if (j === 'settle') { setScreen('settle'); setActiveRoomId('jeju'); setAddOpen(false); }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // mark active rail button
  useEffect(() => {
    const map = { home:'home', create:'create', trip: addOpen ? 'add' : 'trip', settle:'settle' };
    const active = map[screen];
    document.querySelectorAll('.rail button').forEach(b => {
      b.classList.toggle('active', b.dataset.jump === active);
    });
  }, [screen, addOpen]);

  // screen render
  let body = null;
  if (screen === 'home') {
    body = <window.HomeScreen
      rooms={rooms}
      onOpenRoom={(id) => { setActiveRoomId(id); setScreen('trip'); }}
      onCreate={() => { setCreateCtx('fromHome'); setScreen('create'); }}
    />;
  } else if (screen === 'create') {
    body = <window.CreateScreen
      onBack={() => setScreen('home')}
      onCreate={(room) => {
        const newId = 'r-' + Date.now();
        setRooms(rs => [{ ...room, id: newId, status:'live', expenses: [] }, ...rs]);
        setActiveRoomId(newId);
        setScreen('trip');
      }}
    />;
  } else if (screen === 'trip') {
    body = <window.TripScreen
      room={activeRoom}
      onBack={() => setScreen('home')}
      onAdd={() => setAddOpen(true)}
      onSettle={() => setScreen('settle')}
    />;
  } else if (screen === 'settle') {
    body = <window.SettleScreen
      room={activeRoom}
      tweaks={t}
      onBack={() => setScreen('trip')}
      onComplete={() => { completeRoom(activeRoomId); setScreen('home'); }}
    />;
  }

  return (
    <>
      {body}
      {addOpen && activeRoom && (
        <window.AddExpenseSheet
          room={activeRoom}
          onClose={() => setAddOpen(false)}
          onSubmit={(exp) => { addExpense(activeRoomId, exp); setAddOpen(false); }}
        />
      )}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Accent">
          <window.TweakColor label="Point color" value={t.accent}
            options={['#E84F2C','#0A0A0A','#3A6B3A','#C9A227','#A6362C']}
            onChange={(v) => setTweak('accent', v)} />
        </window.TweakSection>
        <window.TweakSection label="Receipt">
          <window.TweakToggle label="Paper texture" value={t.showReceiptTexture}
            onChange={(v) => setTweak('showReceiptTexture', v)} />
        </window.TweakSection>
        <window.TweakSection label="Jump to">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6 }}>
            {[
              ['home','01 홈'], ['create','02 새 여행'],
              ['trip','03 지출 목록'], ['add','04 지출 추가'],
              ['settle','05 정산 결과'],
            ].map(([k,label]) => (
              <button key={k} data-jump={k} style={{
                padding:'8px 10px', background:'#0A0A0A', color:'#fff',
                border:'1px solid #0A0A0A', borderRadius:4, fontSize:12, cursor:'pointer',
                textAlign:'left', fontFamily:'inherit',
              }}>{label}</button>
            ))}
          </div>
        </window.TweakSection>
      </window.TweaksPanel>
    </>
  );
}

window.calcSettlement = calcSettlement;

// Mount
const root = ReactDOM.createRoot(document.getElementById('screen-root'));
root.render(<TriplyApp />);
