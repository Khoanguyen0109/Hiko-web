import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface VoucherDisplayProps {
  rewardLabel: string;
  voucherCode: string;
  qrToken: string;
  expiresAt?: string | null;
}

export default function VoucherDisplay({
  rewardLabel,
  voucherCode,
  qrToken,
  expiresAt,
}: VoucherDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(qrToken, {
      width: 280,
      margin: 1,
      color: { dark: '#1f2d24', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  const expiryText = expiresAt
    ? new Date(expiresAt).toLocaleDateString('vi-VN')
    : null;

  return (
    <>
      <div className="result-icon win">🎉</div>
      <h2 className="result-title">Chúc mừng!</h2>
      <p className="result-prize">Bạn nhận được: {rewardLabel}</p>
      <div className="voucher-box">
        <p className="hint">Mã voucher</p>
        <p className="voucher-code">{voucherCode}</p>
        <div className="qr-placeholder">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Mã QR voucher" className="qr-image" />
          ) : (
            <div className="qr-loading">Đang tạo QR…</div>
          )}
        </div>
        {expiryText ? (
          <p className="hint" style={{ marginTop: '0.5rem' }}>
            Hết hạn: {expiryText}
          </p>
        ) : null}
      </div>
      <p className="staff-note">
        Đưa màn hình này cho nhân viên quét QR tại quầy. Mỗi mã chỉ dùng 1 lần.
      </p>
    </>
  );
}
