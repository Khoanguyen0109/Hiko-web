export interface PublicStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  mapUrl: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankQrImage: string;
}

export interface MenuTopping {
  id: string;
  name: string;
  price: number;
}

export interface MenuSize {
  id: string;
  size: string;
  price: number;
  isDefault: boolean;
}

export interface MenuDish {
  id: string;
  name: string;
  image: string;
  price: number;
  hasSizeVariants: boolean;
  sizes: MenuSize[];
  allowToppings: boolean;
  toppings: MenuTopping[];
}

export interface MenuCategory {
  id: string;
  name: string;
  dishes: MenuDish[];
}

export interface CartLine {
  key: string;
  dishId: string;
  name: string;
  size: string;
  unitPrice: number;
  quantity: number;
  toppings: MenuTopping[];
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  size: string;
  toppings: string[];
}

export interface PublicReceipt {
  publicCode: string;
  transferContent: string;
  orderStatus: string;
  paymentStatus: string;
  orderNote: string;
  customer: { name: string; phone: string; address: string };
  items: ReceiptItem[];
  total: number;
  store: { name: string; address: string; mapUrl: string };
  bank: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    bankQrImage: string;
  };
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export function receiptStatusLabel(status: string, paymentStatus: string): string {
  if (status === 'cancelled') return 'Đã hủy';
  if (status === 'completed') return 'Hoàn tất';
  if (status === 'ready') return 'Sẵn sàng';
  if (status === 'progress') return 'Đang làm';
  if (paymentStatus === 'completed') return 'Đã nhận chuyển khoản';
  return 'Chờ quán xác nhận chuyển khoản';
}
