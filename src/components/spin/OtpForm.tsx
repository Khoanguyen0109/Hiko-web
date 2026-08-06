import { useState } from 'react';
import GoHomeButton from '@/components/spin/GoHomeButton';

interface OtpFormProps {
  phone: string;
  loading: boolean;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
}

export default function OtpForm({
  phone,
  loading,
  onVerify,
  onResend,
  onBack,
}: OtpFormProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!/^\d{6}$/.test(otp)) {
      setError('Vui lòng nhập đúng 6 chữ số.');
      return;
    }
    setError('');
    onVerify(otp);
  }

  return (
    <section className="screen active card">
      <div>
        <label htmlFor="otp">Mã xác thực Zalo</label>
        <p className="hint" style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}>
          Đã gửi mã đến số <strong>{phone}</strong> qua Zalo. Nhập mã 6 số để quay.
        </p>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={otp}
          disabled={loading}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
            if (error) setError('');
          }}
        />
        {error ? (
          <p className="hint error-hint" style={{ marginTop: '0.5rem' }}>
            {error}
          </p>
        ) : null}
      </div>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'Đang xác thực…' : 'Xác nhận'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading}
          onClick={onResend}
        >
          Gửi lại mã
        </button>
      </div>
      <div className="btn-row" style={{ marginTop: '0.5rem' }}>
        <button type="button" className="btn btn-secondary" disabled={loading} onClick={onBack}>
          Đổi số điện thoại
        </button>
        <GoHomeButton />
      </div>
    </section>
  );
}
