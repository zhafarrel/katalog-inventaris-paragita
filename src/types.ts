export type ItemStatus = 'Tersedia' | 'Dipinjam' | 'Pemeliharaan';

export interface BorrowLog {
  id: string;
  borrowerName: string;
  quantity: number;
  borrowDate: string;
  expectedReturnDate: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: ItemStatus;
  availableQuantity: number;
  totalQuantity: number;
  description: string;
  imageUrl: string;
  location: string;
  borrowerInfo?: string;
  borrowDate?: string;
  expectedReturnDate?: string;
  allowPartialBorrowing?: boolean;
  borrowLogs?: BorrowLog[];
  subcategory?: string;
  gender?: string;
}

export interface CartItem extends InventoryItem {
  borrowQuantity: number;
  borrowerName?: string;
  returnDate?: string;
}
