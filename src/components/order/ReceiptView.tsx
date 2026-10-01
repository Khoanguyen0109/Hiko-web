import { useEffect, useState } from 'react';
import type { PublicReceipt } from '@/types/publicOrder';
import { formatVnd, receiptStatusLabel } from '@/types/publicOrder';

interface ReceiptViewProps {
  initialReceipt: PublicReceipt | null;
  token: string;
  error: string;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export default function ReceiptView({ initialReceipt, token, error }: ReceiptViewProps) {
  const [receipt, setReceipt] = useState(initialReceipt);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!token) return undefined;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/order/${encodeURIComponent(token)}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { data?: PublicReceipt };
      if (payload.data) setReceipt(payload.data);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [token]);

  async function copy(label: string, value: string) {
    await copyText(value);
    setCopied(label);
  }

  if (!receipt) {
    return <p className="message">{error || 'Không tìm thấy đơn'}</p>;
  }

  return (
    <main className="receipt">
      <p className="eyebrow">{receiptStatusLabel(receipt.orderStatus, receipt.paymentStatus)}</p>
      <h1>HIKO {receipt.publicCode}</h1>
      <p className="store-line">
        {receipt.store.name}
        {receipt.store.address ? ` · ${receipt.store.address}` : ''}
      </p>
      <ul>
        {receipt.items.map((item, index) => (
          <li key={`${item.name}-${item.size}-${index}`}>
            <span>
              {item.name}
              {item.size ? ` · ${item.size}` : ''} ×{item.quantity}
              {item.toppings.length > 0 ? ` · ${item.toppings.join(', ')}` : ''}
            </span>
            <b>{formatVnd(item.price)}</b>
          </li>
        ))}
      </ul>
      {receipt.orderNote ? <p className="note">Ghi chú: {receipt.orderNote}</p> : null}
      <p className="deliver">Giao tới {receipt.customer.address}</p>
      <p className="amount">{formatVnd(receipt.total)}</p>
      <p className="hint">Chuyển đúng số tiền và ghi nội dung bên dưới.</p>
      {receipt.bank.bankQrImage ? (
        <img src={receipt.bank.bankQrImage} alt="Mã QR chuyển khoản" />
      ) : (
        <p className="message">Quán chưa gắn ảnh QR.</p>
      )}
      <dl>
        <div>
          <dt>Ngân hàng</dt>
          <dd>{receipt.bank.bankName || '—'}</dd>
        </div>
        <div>
          <dt>Số tài khoản</dt>
          <dd>
            {receipt.bank.bankAccountNumber || '—'}
            {receipt.bank.bankAccountNumber ? (
              <button type="button" onClick={() => copy('account', receipt.bank.bankAccountNumber)}>Sao chép</button>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Chủ tài khoản</dt>
          <dd>{receipt.bank.bankAccountName || '—'}</dd>
        </div>
        <div>
          <dt>Nội dung</dt>
          <dd>
            {receipt.transferContent}
            <button type="button" onClick={() => copy('content', receipt.transferContent)}>Sao chép</button>
          </dd>
        </div>
      </dl>
      {copied ? <p className="copied">Đã sao chép</p> : null}
    </main>
  );
}
