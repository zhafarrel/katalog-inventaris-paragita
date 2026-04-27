import React from 'react';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';

interface CartModalProps {
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cart: CartItem[];
  toggleCartItem: (item: CartItem) => void;
  handleCheckout: () => void;
}

export function CartModal({
  isCartOpen,
  setIsCartOpen,
  cart,
  toggleCartItem,
  handleCheckout
}: CartModalProps) {
  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart size={24} className="text-indigo-600 dark:text-indigo-400" />
                Keranjang Peminjaman
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                    <ShoppingCart className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Keranjang Kosong</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Belum ada barang yang dipilih untuk dipinjam.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-6 px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    Cari Barang
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl bg-gray-200 dark:bg-gray-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.category}</p>
                        <div className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          Jumlah: {item.borrowQuantity} buah
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleCartItem(item)} 
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors flex-shrink-0"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Barang</span>
                <span className="font-bold text-gray-900 dark:text-white">{cart.length} Item</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Ajukan Peminjaman via WA
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
