import { useEffect, useState } from 'react';
import type { CartLine, MenuCategory, MenuDish, MenuTopping, PublicStore } from '@/types/publicOrder';
import { formatVnd } from '@/types/publicOrder';

const SWATCHES = ['#B9D77A', '#D7F0E2', '#F5E7CF', '#82CFA1', '#FFF8E8', '#4DB779'];

function lineKey(dishId: string, size: string, toppings: MenuTopping[]): string {
  const toppingKey = toppings.map((topping) => topping.id).sort().join(',');
  return `${dishId}|${size}|${toppingKey}`;
}

async function readJson<T>(request: Promise<Response>): Promise<T> {
  const response = await request;
  const payload = (await response.json()) as { data?: T; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || 'Không tải được dữ liệu');
  }
  return payload.data as T;
}

export default function OrderApp() {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [storeId, setStoreId] = useState('');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickedToppings, setPickedToppings] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    readJson<PublicStore[]>(fetch('/api/order/stores'))
      .then((nextStores) => {
        if (cancelled) return;
        setStores(nextStores);
        setStoreId(nextStores[0]?.id || '');
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Không tải được cửa hàng');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setError('');
    readJson<{ categories: MenuCategory[] }>(fetch(`/api/order/menu?storeId=${encodeURIComponent(storeId)}`))
      .then((menu) => {
        if (cancelled) return;
        setCategories(menu.categories);
        setCategoryId(menu.categories[0]?.id || '');
        setCart([]);
        setPickedToppings({});
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Không tải được menu');
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const store = stores.find((entry) => entry.id === storeId);
  const dishes = categories.find((category) => category.id === categoryId)?.dishes || [];
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const phoneValid = /^\d{10}$/.test(phone);
  const canSubmit = cart.length > 0 && name.trim().length > 0 && phoneValid && address.trim().length > 0 && !submitting;

  function toggleTopping(dish: MenuDish, toppingId: string) {
    setPickedToppings((current) => {
      const selected = current[dish.id] || [];
      const next = selected.includes(toppingId)
        ? selected.filter((id) => id !== toppingId)
        : [...selected, toppingId];
      return { ...current, [dish.id]: next };
    });
  }

  function addDish(dish: MenuDish, sizeName: string, unitPrice: number) {
    const toppings = dish.toppings.filter((topping) => (pickedToppings[dish.id] || []).includes(topping.id));
    const toppingTotal = toppings.reduce((sum, topping) => sum + topping.price, 0);
    const key = lineKey(dish.id, sizeName, toppings);
    const linePrice = unitPrice + toppingTotal;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) => (line.key === key ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...current, { key, dishId: dish.id, name: dish.name, size: sizeName, unitPrice: linePrice, quantity: 1, toppings }];
    });
  }

  function changeQuantity(key: string, delta: number) {
    setCart((current) =>
      current
        .map((line) => (line.key === key ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  async function submitOrder() {
    if (!canSubmit || !store) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await readJson<{ token: string }>(
        fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: store.id,
            orderNote: note.trim(),
            customer: { name: name.trim(), phone, address: address.trim() },
            items: cart.map((line) => ({
              dishId: line.dishId,
              size: line.size,
              quantity: line.quantity,
              toppingIds: line.toppings.map((topping) => topping.id),
            })),
          }),
        })
      );
      window.location.assign(`/order/${created.token}`);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Không gửi được yêu cầu');
      setSubmitting(false);
    }
  }

  const fields = (
    <>
      {cart.length === 0 ? <p className="empty">Chưa chọn món.</p> : null}
      {cart.map((line) => (
        <div className="line" key={line.key}>
          <span>
            {line.name}
            {line.size ? ` · ${line.size}` : ''}
            {line.toppings.length > 0 ? ` · ${line.toppings.map((topping) => topping.name).join(', ')}` : ''}
            <span className="qty">
              <button type="button" onClick={() => changeQuantity(line.key, -1)} aria-label="Bớt">−</button>
              {line.quantity}
              <button type="button" onClick={() => changeQuantity(line.key, 1)} aria-label="Thêm">+</button>
            </span>
          </span>
          <b>{formatVnd(line.unitPrice * line.quantity)}</b>
        </div>
      ))}
      <label>
        Ghi chú
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} />
      </label>
      <label>
        Tên
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
      </label>
      <label>
        Số điện thoại
        <input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" />
      </label>
      <label>
        Địa chỉ
        <input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={200} />
      </label>
      {error ? <p className="message">{error}</p> : null}
      <div className="total"><span>Tổng</span>{formatVnd(total)}</div>
      <button className="submit" type="button" disabled={!canSubmit} onClick={submitOrder}>
        {submitting ? 'Đang gửi' : 'Gửi yêu cầu'}
      </button>
      <p className="pay">Thanh toán chuyển khoản</p>
    </>
  );

  return (
    <div className={sheetOpen ? 'order-app sheet-open' : 'order-app'}>
      <header className="order-header">
        <h1 className="logo">Đặt món</h1>
        <nav className="stores">
          {stores.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={entry.id === storeId ? 'on' : undefined}
              onClick={() => setStoreId(entry.id)}
            >
              {entry.name}
              <small>{entry.address}</small>
            </button>
          ))}
        </nav>
        {store?.mapUrl ? (
          <a className="map-link" href={store.mapUrl} target="_blank" rel="noreferrer">Mở Google Maps</a>
        ) : null}
      </header>
      <nav className="tabs">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={category.id === categoryId ? 'on' : undefined}
            onClick={() => setCategoryId(category.id)}
          >
            {category.name}
          </button>
        ))}
      </nav>
      <div className="order-body">
        <section className="grid">
          {loading ? <p className="empty">Đang tải menu.</p> : null}
          {!loading && dishes.length === 0 ? <p className="empty">Cửa hàng chưa có món.</p> : null}
          {dishes.map((dish, index) => (
            <article className="tile" key={dish.id}>
              <div
                className={dish.image ? 'swatch has-photo' : 'swatch'}
                style={{
                  backgroundColor: SWATCHES[index % SWATCHES.length],
                  backgroundImage: dish.image ? `url("${dish.image}")` : undefined,
                }}
              >
                {dish.image ? '' : 'Ảnh từ POS'}
              </div>
              <h2>{dish.name}</h2>
              <div className="sizes">
                {dish.hasSizeVariants ? dish.sizes.map((size) => (
                  <button key={size.id} type="button" onClick={() => addDish(dish, size.size, size.price)}>
                    {size.size} {formatVnd(size.price)}
                  </button>
                )) : (
                  <button type="button" onClick={() => addDish(dish, '', dish.price)}>
                    {formatVnd(dish.price)}
                  </button>
                )}
              </div>
              {dish.allowToppings ? (
                <div className="toppings">
                  {dish.toppings.map((topping) => {
                    const on = (pickedToppings[dish.id] || []).includes(topping.id);
                    return (
                      <button
                        key={topping.id}
                        type="button"
                        className={on ? 'on' : undefined}
                        onClick={() => toggleTopping(dish, topping.id)}
                      >
                        {topping.name} +{formatVnd(topping.price)}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </article>
          ))}
        </section>
        <aside className="bag">
          <button className="close-sheet" type="button" onClick={() => setSheetOpen(false)}>Đóng</button>
          <h3>Giỏ</h3>
          <p className="sub">{store ? `${store.name} nhận đơn này` : 'Chọn cửa hàng'}</p>
          {fields}
        </aside>
      </div>
      <button className="sheet-back" type="button" aria-label="Đóng phiếu" onClick={() => setSheetOpen(false)} />
      <div className="dock">
        <div>
          <b>{itemCount} món</b>
          <span>{formatVnd(total)} · chuyển khoản</span>
        </div>
        <button className="submit" type="button" onClick={() => setSheetOpen(true)}>Xem phiếu</button>
      </div>
    </div>
  );
}
