import { useState } from 'react';
import { normalizePhone } from '@/lib/spinUtils';
import GoHomeButton from '@/components/spin/GoHomeButton';

interface PhoneFormProps {
  loading: boolean;
  onSpin: (phone: string) => void;
  onLookup: (phone: string) => void;
}

export default function PhoneForm({ loading, onSpin, onLookup }: PhoneFormProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  function validate(): string | null {
    const normalized = normalizePhone(phone);

    if (!normalized) {
      setError('Vui lòng nhập đúng 10 chữ số.');
      return null;
    }

    setError('');
    return normalized;
  }

  function handleSpin() {
    const normalized = validate();
    if (normalized) onSpin(normalized);
  }

  function handleLookup() {
    const normalized = validate();
    if (normalized) onLookup(normalized);
  }

  return (
    <section className="screen active card">
      <div>
        <label htmlFor="phone">Số điện thoại</label>
        <div className="phone-row">
          <span className="prefix">+84</span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="912345678"
            value={phone}
            disabled={loading}
            onChange={(event) => {
              setPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
              if (error) setError('');
            }}
          />
        </div>
        {error ? (
          <p className="hint error-hint" style={{ marginTop: '0.5rem' }}>
            {error}
          </p>
        ) : (
          <p className="hint" style={{ marginTop: '0.5rem' }}>
            Lần đầu quay sẽ nhận mã xác thực qua Zalo. Mỗi số có giới hạn lượt theo chiến
            dịch.
          </p>
        )}
      </div>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading}
          onClick={handleSpin}
        >
          {loading ? 'Đang xử lý…' : 'Quay Ngay'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading}
          onClick={handleLookup}
        >
          Xem Voucher Của Tôi
        </button>
        <GoHomeButton />
      </div>
    </section>
  );
}
