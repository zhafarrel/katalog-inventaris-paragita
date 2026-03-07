export type ItemStatus = 'Tersedia' | 'Dipinjam' | 'Pemeliharaan';

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
}

export interface CartItem extends InventoryItem {
  borrowQuantity: number;
  borrowerName?: string;
}
