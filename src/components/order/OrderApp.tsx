import { useEffect, useState } from 'react';
import type { CartLine, CartTopping, MenuCategory, MenuDish, MenuTopping, MenuToppingGroup, PublicStore } from '@/types/publicOrder';
import { formatVnd } from '@/types/publicOrder';

const SWATCHES = ['#B9D77A', '#D7F0E2', '#F5E7CF', '#82CFA1', '#FFF8E8', '#4DB779'];

const PUBLISHED_PLACES = [
  {
    match: 'lê lợi',
    address: '101 Lê Lợi, P. Hạnh Thông, Gò Vấp',
    mapUrl: 'https://maps.app.goo.gl/Akt6yLFQ7qmyftWG7',
  },
  {
    match: 'lê văn sỹ',
    address: '281/25/1 Lê Văn Sỹ, P.1, Quận Tân Bình',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=281%2F25%2F1+L%C3%AA+V%C4%83n+S%E1%BB%B9,+Ph%C6%B0%E1%BB%9Dng+1,+Qu%E1%BA%ADn+T%C3%A2n+B%C3%ACnh',
  },
];

function withPublishedPlace(store: PublicStore): PublicStore {
  const name = store.name.toLocaleLowerCase('vi');
  const known = PUBLISHED_PLACES.find((place) => name.includes(place.match));
  if (!known) return store;
  return {
    ...store,
    address: store.address.trim() || known.address,
    mapUrl: store.mapUrl.trim() || known.mapUrl,
  };
}

function lineKey(dishId: string, size: string, toppings: CartTopping[]): string {
  const toppingKey = toppings
    .map((topping) => `${topping.id}:${topping.quantity}`)
    .sort()
    .join(',');
  return `${dishId}|${size}|${toppingKey}`;
}

function toppingLabel(topping: CartTopping): string {
  return topping.quantity > 1 ? `${topping.name} ×${topping.quantity}` : topping.name;
}

function groupsForDish(dish: MenuDish): MenuToppingGroup[] {
  if (!dish.allowToppings) return [];
  const groups = new Map<string, MenuTopping[]>();
  for (const topping of dish.toppings) {
    const category = topping.category || 'Topping';
    const list = groups.get(category) || [];
    list.push(topping);
    groups.set(category, list);
  }
  return [...groups.entries()].map(([category, toppings]) => ({ category, toppings }));
}

interface PickerState {
  dish: MenuDish;
  size: string;
  price: number;
  quantity: number;
  toppingQty: Record<string, number>;
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
  const [picker, setPicker] = useState<PickerState | null>(null);
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
        setStores(nextStores.map(withPublishedPlace));
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
    readJson<{ categories: MenuCategory[] }>(
      fetch(`/api/order/menu?storeId=${encodeURIComponent(storeId)}`)
    )
      .then((menu) => {
        if (cancelled) return;
        setCategories(menu.categories);
        setCategoryId(menu.categories[0]?.id || '');
        setCart([]);
        setPicker(null);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Không tải được menu');
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const pickerGroups = picker ? groupsForDish(picker.dish) : [];
  const pickerToppings: CartTopping[] = picker
    ? picker.dish.toppings
        .filter((topping) => (picker.toppingQty[topping.id] || 0) > 0)
        .map((topping) => ({ ...topping, quantity: picker.toppingQty[topping.id] }))
    : [];
  const pickerTotal = picker
    ? (picker.price + pickerToppings.reduce((sum, topping) => sum + topping.price * topping.quantity, 0)) * picker.quantity
    : 0;

  const store = stores.find((entry) => entry.id === storeId);
  const activeCategory = categories.find((category) => category.id === categoryId);
  const dishes = activeCategory?.dishes || [];
  const categoryName = activeCategory?.name || '';
  const categoryColor = activeCategory?.color || '';
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const phoneValid = /^\d{10}$/.test(phone);
  const canSubmit = cart.length > 0 && name.trim().length > 0 && phoneValid && address.trim().length > 0 && !submitting;

  function openPicker(dish: MenuDish) {
    const defaultSize = dish.sizes.find((size) => size.isDefault) || dish.sizes[0];
    setPicker({
      dish,
      size: dish.hasSizeVariants && defaultSize ? defaultSize.size : '',
      price: dish.hasSizeVariants && defaultSize ? defaultSize.price : dish.price,
      quantity: 1,
      toppingQty: {},
    });
  }

  function changeToppingQty(toppingId: string, delta: number) {
    setPicker((current) => {
      if (!current) return current;
      const nextQty = Math.min(10, Math.max(0, (current.toppingQty[toppingId] || 0) + delta));
      const toppingQty = { ...current.toppingQty };
      if (nextQty === 0) delete toppingQty[toppingId];
      else toppingQty[toppingId] = nextQty;
      return { ...current, toppingQty };
    });
  }

  function confirmPicker() {
    if (!picker) return;
    const toppings: CartTopping[] = picker.dish.toppings
      .filter((topping) => (picker.toppingQty[topping.id] || 0) > 0)
      .map((topping) => ({ ...topping, quantity: picker.toppingQty[topping.id] }));
    const toppingTotal = toppings.reduce((sum, topping) => sum + topping.price * topping.quantity, 0);
    const unitPrice = picker.price + toppingTotal;
    const key = lineKey(picker.dish.id, picker.size, toppings);
    const quantity = picker.quantity;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) => (line.key === key ? { ...line, quantity: line.quantity + quantity } : line));
      }
      return [...current, {
        key,
        dishId: picker.dish.id,
        name: picker.dish.name,
        size: picker.size,
        unitPrice,
        quantity,
        toppings,
      }];
    });
    setPicker(null);
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
              toppings: line.toppings.map((topping) => ({
                toppingId: topping.id,
                quantity: topping.quantity,
              })),
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
            {line.toppings.length > 0 ? ` · ${line.toppings.map(toppingLabel).join(', ')}` : ''}
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
        <p className="store-label">Đặt tại</p>
        <div className="stores">
          {stores.map((entry) => (
            <div key={entry.id} className={entry.id === storeId ? 'store-card on' : 'store-card'}>
              <button type="button" onClick={() => setStoreId(entry.id)}>
                <strong>{entry.name}</strong>
                {entry.address ? <small>{entry.address}</small> : null}
              </button>
              {entry.mapUrl ? (
                <a className="map-link" href={entry.mapUrl} target="_blank" rel="noreferrer">
                  Mở Google Maps
                </a>
              ) : null}
            </div>
          ))}
        </div>
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
          {dishes.map((dish, index) => {
            const fromPrice = dish.hasSizeVariants && dish.sizes.length > 0
              ? Math.min(...dish.sizes.map((size) => size.price))
              : dish.price;
            const color = categoryColor || SWATCHES[index % SWATCHES.length];
            return (
              <article className="tile" key={dish.id}>
                <button type="button" className="tile-open" onClick={() => openPicker(dish)}>
                  <div className="swatch" style={{ backgroundColor: color }}>
                    {dish.image ? <img src={dish.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}
                    <span>{categoryName}</span>
                  </div>
                  <h2>{dish.name}</h2>
                  <p className="from-price">{formatVnd(fromPrice)}</p>
                </button>
              </article>
            );
          })}
        </section>
        <aside className="bag" data-lenis-prevent>
          <button className="close-sheet" type="button" onClick={() => setSheetOpen(false)}>Đóng</button>
          <h3>Giỏ</h3>
          <p className="sub">{store ? `${store.name} nhận đơn này` : 'Chọn cửa hàng'}</p>
          {fields}
        </aside>
      </div>
      {picker ? (
        <>
          <button className="picker-back" type="button" aria-label="Đóng món" onClick={() => setPicker(null)} />
          <aside className="picker" data-lenis-prevent>
            <div className="picker-scroll">
            <button className="close-sheet" type="button" onClick={() => setPicker(null)}>Đóng</button>
            {picker.dish.image ? (
              <div className="swatch picker-photo" style={{ backgroundColor: categoryColor || '#B9D77A' }}>
                <img src={picker.dish.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />
                {categoryName ? <span>{categoryName}</span> : null}
              </div>
            ) : null}
            <h3>{picker.dish.name}</h3>
            {picker.dish.hasSizeVariants ? (
              <div className="picker-block">
                <h4>Size</h4>
                <div className="sizes">
                  {picker.dish.sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      className={picker.size === size.size ? 'on' : undefined}
                      onClick={() => setPicker({ ...picker, size: size.size, price: size.price })}
                    >
                      {size.size} {formatVnd(size.price)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="from-price">{formatVnd(picker.price)}</p>
            )}
            {pickerGroups.map((group) => (
              <div className="picker-block" key={group.category}>
                <h4>{group.category}</h4>
                {group.toppings.map((topping) => {
                  const quantity = picker.toppingQty[topping.id] || 0;
                  return (
                    <div className="topping-row" key={topping.id}>
                      <span>
                        {topping.name}
                        <small>+{formatVnd(topping.price)}</small>
                      </span>
                      <span className="qty">
                        <button type="button" onClick={() => changeToppingQty(topping.id, -1)} disabled={quantity === 0} aria-label="Bớt topping">−</button>
                        {quantity}
                        <button type="button" onClick={() => changeToppingQty(topping.id, 1)} aria-label="Thêm topping">+</button>
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="picker-block">
              <h4>Số lượng</h4>
              <span className="qty">
                <button type="button" onClick={() => setPicker({ ...picker, quantity: Math.max(1, picker.quantity - 1) })} aria-label="Bớt">−</button>
                {picker.quantity}
                <button type="button" onClick={() => setPicker({ ...picker, quantity: Math.min(20, picker.quantity + 1) })} aria-label="Thêm">+</button>
              </span>
            </div>
            </div>
            <div className="picker-foot">
              <button className="submit" type="button" onClick={confirmPicker}>
                Thêm vào giỏ · {formatVnd(pickerTotal)}
              </button>
            </div>
          </aside>
        </>
      ) : null}
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
