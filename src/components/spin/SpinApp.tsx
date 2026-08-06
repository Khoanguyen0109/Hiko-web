import { useCallback, useMemo, useState } from 'react';
import PhoneForm from '@/components/spin/PhoneForm';
import OtpForm from '@/components/spin/OtpForm';
import SpinWheel from '@/components/spin/SpinWheel';
import VoucherDisplay from '@/components/spin/VoucherDisplay';
import GoHomeButton from '@/components/spin/GoHomeButton';
import {
  findLoseSlotIndex,
  findSlotIndexByLabel,
  mapSlotsToDisplay,
} from '@/lib/spinUtils';
import type {
  LookupResult,
  PlayResult,
  PublicCampaign,
} from '@/types/campaign';

type Screen =
  | 'phone'
  | 'otp'
  | 'wheel'
  | 'win'
  | 'lose'
  | 'lookup-none'
  | 'lookup-redeemed'
  | 'lookup-expired';

interface SpinAppProps {
  slug: string;
  campaign: PublicCampaign;
}

interface WinState {
  rewardLabel: string;
  voucherCode: string;
  qrToken: string;
  expiresAt: string | null;
}

interface OtpSendResult {
  success: boolean;
  alreadyVerified: boolean;
  expiresInSeconds?: number;
  message?: string;
}

interface OtpVerifyResult {
  success: boolean;
  verified: boolean;
  message?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.');
  }
  return data;
}

export default function SpinApp({ slug, campaign }: SpinAppProps) {
  const [screen, setScreen] = useState<Screen>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [targetIndex, setTargetIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [pendingScreen, setPendingScreen] = useState<'win' | 'lose'>('win');
  const [winState, setWinState] = useState<WinState | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const displaySlots = useMemo(
    () => mapSlotsToDisplay(campaign.wheelSlots),
    [campaign.wheelSlots]
  );

  const resetToPhone = useCallback(() => {
    setScreen('phone');
    setError('');
    setStatusMessage('');
    setWinState(null);
    setSpinning(false);
    setPendingPhone('');
  }, []);

  const handleWheelComplete = useCallback(() => {
    setSpinning(false);
    setScreen(pendingScreen);
  }, [pendingScreen]);

  const startWheelAnimation = useCallback((index: number, nextScreen: 'win' | 'lose') => {
    setTargetIndex(index);
    setPendingScreen(nextScreen);
    setSpinKey((current) => current + 1);
    setSpinning(true);
    setScreen('wheel');
  }, []);

  const runPlay = useCallback(
    async (phone: string) => {
      const response = await fetch(`/api/campaign/${slug}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const result = await readJson<PlayResult>(response);

      if (result.result === 'win') {
        setWinState({
          rewardLabel: result.reward.label,
          voucherCode: result.voucher.code,
          qrToken: result.voucher.qrToken,
          expiresAt: result.voucher.expiresAt,
        });
        const index = findSlotIndexByLabel(campaign.wheelSlots, result.reward.label);
        startWheelAnimation(index, 'win');
        return;
      }

      if (result.result === 'lose') {
        const index = findLoseSlotIndex(campaign.wheelSlots);
        startWheelAnimation(index, 'lose');
        return;
      }

      setStatusMessage('Bạn đã hết lượt quay cho chiến dịch này.');
      setScreen('lose');
    },
    [slug, campaign.wheelSlots, startWheelAnimation]
  );

  const handleSpinRequest = useCallback(
    async (phone: string) => {
      setLoading(true);
      setError('');
      setPendingPhone(phone);

      try {
        const response = await fetch(`/api/campaign/${slug}/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });

        const result = await readJson<OtpSendResult>(response);

        if (result.alreadyVerified) {
          await runPlay(phone);
          return;
        }

        setScreen('otp');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không gửi được mã xác thực.');
        setScreen('phone');
      } finally {
        setLoading(false);
      }
    },
    [slug, runPlay]
  );

  const handleOtpVerify = useCallback(
    async (otp: string) => {
      if (!pendingPhone) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/campaign/${slug}/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: pendingPhone, otp }),
        });

        await readJson<OtpVerifyResult>(response);
        await runPlay(pendingPhone);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Mã xác thực không đúng.');
        setScreen('otp');
      } finally {
        setLoading(false);
      }
    },
    [slug, pendingPhone, runPlay]
  );

  const handleOtpResend = useCallback(async () => {
    if (!pendingPhone) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/campaign/${slug}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone }),
      });

      const result = await readJson<OtpSendResult>(response);

      if (result.alreadyVerified) {
        await runPlay(pendingPhone);
        return;
      }

      setStatusMessage('Đã gửi lại mã qua Zalo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi lại được mã.');
    } finally {
      setLoading(false);
    }
  }, [slug, pendingPhone, runPlay]);

  const handleLookup = useCallback(
    async (phone: string) => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/campaign/${slug}/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });

        const result = await readJson<LookupResult>(response);

        if (result.status === 'active') {
          setWinState({
            rewardLabel: result.reward.label,
            voucherCode: result.voucher.code,
            qrToken: result.voucher.qrToken,
            expiresAt: result.voucher.expiresAt,
          });
          setScreen('win');
          return;
        }

        if (result.status === 'redeemed') {
          setStatusMessage(result.message);
          setScreen('lookup-redeemed');
          return;
        }

        if (result.status === 'expired') {
          setStatusMessage(result.message);
          setScreen('lookup-expired');
          return;
        }

        setStatusMessage(result.message);
        setScreen('lookup-none');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tra cứu voucher.');
        setScreen('phone');
      } finally {
        setLoading(false);
      }
    },
    [slug]
  );

  return (
    <>
      {screen === 'phone' ? (
        <>
          {error ? (
            <p className="banner-error" role="alert">
              {error}
            </p>
          ) : null}
          <PhoneForm
            loading={loading}
            onSpin={handleSpinRequest}
            onLookup={handleLookup}
          />
        </>
      ) : null}

      {screen === 'otp' ? (
        <>
          {error ? (
            <p className="banner-error" role="alert">
              {error}
            </p>
          ) : null}
          {statusMessage ? (
            <p className="hint" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              {statusMessage}
            </p>
          ) : null}
          <OtpForm
            phone={pendingPhone}
            loading={loading}
            onVerify={handleOtpVerify}
            onResend={handleOtpResend}
            onBack={resetToPhone}
          />
        </>
      ) : null}

      {screen === 'wheel' ? (
        <section className="screen active card">
          <p className="hint" style={{ textAlign: 'center' }}>
            Đang quay… Chúc bạn may mắn!
          </p>
          <SpinWheel
            key={spinKey}
            slots={displaySlots}
            targetIndex={targetIndex}
            spinning={spinning}
            onComplete={handleWheelComplete}
          />
        </section>
      ) : null}

      {screen === 'win' && winState ? (
        <section className="screen active card">
          <VoucherDisplay
            rewardLabel={winState.rewardLabel}
            voucherCode={winState.voucherCode}
            qrToken={winState.qrToken}
            expiresAt={winState.expiresAt}
          />
          <div className="btn-row">
            <button type="button" className="btn btn-secondary" onClick={resetToPhone}>
              Quay lại
            </button>
            <GoHomeButton />
          </div>
        </section>
      ) : null}

      {screen === 'lose' ? (
        <section className="screen active card">
          <div className="result-icon lose">🍃</div>
          <h2 className="result-title">Chưa trúng lần này</h2>
          <p className="staff-note" style={{ marginTop: '0.5rem' }}>
            {statusMessage ||
              'Chúc bạn may mắn lần sau! Bạn đã hết lượt quay cho chiến dịch này.'}
          </p>
          <button type="button" className="btn btn-secondary" onClick={resetToPhone}>
            Quay lại
          </button>
        </section>
      ) : null}

      {screen === 'lookup-none' ? (
        <section className="screen active card">
          <div className="result-icon lose">🔍</div>
          <h2 className="result-title">Không tìm thấy voucher</h2>
          <p className="staff-note" style={{ marginTop: '0.5rem' }}>
            {statusMessage}
          </p>
          <button type="button" className="btn btn-secondary" onClick={resetToPhone}>
            Quay lại
          </button>
        </section>
      ) : null}

      {screen === 'lookup-redeemed' ? (
        <section className="screen active card">
          <div className="result-icon lose">✅</div>
          <h2 className="result-title">Voucher đã sử dụng</h2>
          <p className="staff-note" style={{ marginTop: '0.5rem' }}>
            {statusMessage}
          </p>
          <button type="button" className="btn btn-secondary" onClick={resetToPhone}>
            Quay lại
          </button>
        </section>
      ) : null}

      {screen === 'lookup-expired' ? (
        <section className="screen active card">
          <div className="result-icon lose">⏰</div>
          <h2 className="result-title">Voucher đã hết hạn</h2>
          <p className="staff-note" style={{ marginTop: '0.5rem' }}>
            {statusMessage}
          </p>
          <button type="button" className="btn btn-secondary" onClick={resetToPhone}>
            Quay lại
          </button>
        </section>
      ) : null}
    </>
  );
}
