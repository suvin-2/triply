import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ref, update } from 'firebase/database';
import html2canvas from 'html2canvas';
import { db } from '../../lib/firebase';
import { useRoom } from '../../hooks/useRoom';
import { calcSettlement } from '../../utils/settlement';
import { fmt } from '../../utils/format';
import { Chevron } from '../../components/shared/atoms';
import ReceiptCard from './ReceiptCard';
import s from './SettleScreen.module.scss';

/**
 * 5본 — 정산 결과 화면.
 * 송금 내역 탭: 최소 송금 횟수 이체 목록 + 토스/카카오페이 딥링크.
 * 영수증 카드 탭: 스토리 미리보기 + 이미지 저장 / Web Share API 공유.
 * 하단 정산 완료 버튼 → Firebase status:'done' → 홈 이동.
 */
export default function SettleScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, loading, error } = useRoom(roomId ?? '');
  const [tab, setTab] = useState<'transfers' | 'receipt'>('transfers');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settling, setSettling] = useState(false);
  const [capturing, setCapturing] = useState(false);

  // ReceiptCard DOM 요소 — html2canvas 캡처 대상
  const receiptRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className={s.screen}>
        <div className={s.center}>
          <p className={s.loadingText}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className={s.screen}>
        <div className={s.center}>
          <p className={s.errorText}>{error ?? '방 정보를 찾을 수 없어요.'}</p>
          <button
            onClick={() => navigate('/')}
            style={{ fontSize: 13, color: '#8C8579', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { transfers } = calcSettlement(room.members, room.expenses);
  const total = room.expenses.reduce((sum, e) => sum + e.amount, 0);
  // async 클로저에서 TypeScript가 room을 다시 null로 볼 수 있으므로 미리 캡처
  const roomName = room.name;

  async function handleDone() {
    if (settling) return;
    setSettling(true);
    try {
      await update(ref(db, `rooms/${roomId}`), { status: 'done' });
      navigate('/');
    } catch (err) {
      console.error('[SettleScreen] 정산 완료 처리 실패:', err);
      alert('처리에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSettling(false);
    }
  }

  function openToss(amount: number) {
    window.location.href = `supertoss://send?amount=${amount}`;
  }

  function openKakaoPay(amount: number) {
    window.location.href = `kakaopay://transfer?amount=${amount}`;
  }

  /** receiptRef 요소를 2× 해상도 PNG Blob으로 캡처한다. */
  async function captureCard(): Promise<Blob> {
    if (!receiptRef.current) throw new Error('영수증 카드를 찾을 수 없어요.');
    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('이미지 변환에 실패했어요.'));
      }, 'image/png');
    });
  }

  async function handleSave() {
    if (capturing) return;
    setCapturing(true);
    try {
      const blob = await captureCard();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${roomName}-정산.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[SettleScreen] 이미지 저장 실패:', err);
      alert('이미지 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setCapturing(false);
    }
  }

  async function handleShare() {
    if (capturing) return;
    setCapturing(true);
    try {
      const blob = await captureCard();
      const file = new File([blob], `${roomName}-정산.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `${roomName} 정산`, files: [file] });
      } else {
        // Web Share API 미지원 환경 — 이미지 다운로드로 대체
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${roomName}-정산.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // 사용자가 공유 취소한 경우(AbortError)는 에러 아님
      if ((err as Error).name !== 'AbortError') {
        console.error('[SettleScreen] 공유 실패:', err);
        alert('공유에 실패했어요. 다시 시도해주세요.');
      }
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className={s.screen}>
      {/* 상단 바 */}
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={() => navigate(`/room/${roomId}`)} aria-label="뒤로">
          <Chevron dir="left" size={14} color="#0A0A0A" />
        </button>
        <div className={s.topTitle}>정산 결과</div>
        <div style={{ width: 22 }} />
      </div>

      {/* 히어로 */}
      <div className={s.hero}>
        <h2 className={s.tripName}>{room.name}</h2>
        <div className={s.heroMeta}>
          <span className={s.heroLabel}>총 지출</span>
          <span className={`mono ${s.heroAmount}`}>{fmt(total)}원</span>
          <span className={s.heroMember}>{room.members.length}명 · {transfers.length}건 송금</span>
        </div>
      </div>

      {/* 탭 */}
      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === 'transfers' ? s.active : s.inactive}`}
          onClick={() => setTab('transfers')}
        >
          송금 내역
        </button>
        <button
          className={`${s.tab} ${tab === 'receipt' ? s.active : s.inactive}`}
          onClick={() => setTab('receipt')}
        >
          영수증 카드
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className={s.tabContent}>

        {/* 송금 내역 탭 */}
        {tab === 'transfers' && (
          <div className={s.transferList}>
            {transfers.length === 0 ? (
              <div className={s.emptyTransfers}>
                <p className={s.emptyTitle}>정산이 필요 없어요</p>
                <p className={s.emptySub}>모두 균등하게 나눠냈어요.</p>
              </div>
            ) : (
              transfers.map((t, i) => (
                <div key={i} className={s.transferRow}>
                  <div className={s.transferInfo}>
                    <div className={s.transferParties}>
                      <span className={s.fromName}>{t.from}</span>
                      <span className={s.arrow}>→</span>
                      <span className={s.toName}>{t.to}</span>
                    </div>
                    <div className={`mono ${s.transferAmount}`}>{fmt(t.amount)}원</div>
                  </div>
                  <div className={s.deepLinks}>
                    <button className={s.tossBtn} onClick={() => openToss(t.amount)}>
                      토스
                    </button>
                    <button className={s.kakaoBtn} onClick={() => openKakaoPay(t.amount)}>
                      카카오페이
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 영수증 카드 탭 */}
        {tab === 'receipt' && (
          <div className={s.receiptWrap}>
            {/* 스토리 미리보기: 검정 배경 + -2deg 회전 */}
            <div className={s.storyPreview}>
              <div className={s.cardRotated}>
                <ReceiptCard ref={receiptRef} room={room} transfers={transfers} total={total} />
              </div>
            </div>

            <div className={s.shareActions}>
              <button
                className={s.saveBtn}
                onClick={handleSave}
                disabled={capturing}
              >
                {capturing ? '처리 중...' : '이미지 저장'}
              </button>
              <button
                className={s.shareBtn}
                onClick={handleShare}
                disabled={capturing}
              >
                {capturing ? '처리 중...' : '공유하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 정산 완료 버튼 */}
      <div className={s.bottomBar}>
        <button
          className={s.doneBtn}
          onClick={() => setConfirmOpen(true)}
          disabled={settling || room.status === 'done'}
        >
          {room.status === 'done' ? '이미 정산 완료된 여행이에요' : '정산 완료로 표시하기'}
        </button>
      </div>

      {/* 정산 완료 확인 다이얼로그 */}
      {confirmOpen && (
        <div className={s.dialogOverlay} onClick={() => setConfirmOpen(false)}>
          <div className={s.dialog} onClick={(e) => e.stopPropagation()}>
            <p className={s.dialogTitle}>정말 정산 완료로 표시할까요?</p>
            <p className={s.dialogDesc}>
              완료로 표시하면 홈에서 '정산완료'로 표시돼요.
              <br />방과 지출 내역은 그대로 유지돼요.
            </p>
            <div className={s.dialogBtns}>
              <button className={s.dialogCancel} onClick={() => setConfirmOpen(false)}>
                취소
              </button>
              <button
                className={s.dialogConfirm}
                onClick={() => { setConfirmOpen(false); handleDone(); }}
              >
                완료로 표시
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
