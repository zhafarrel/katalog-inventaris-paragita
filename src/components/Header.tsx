import React from 'react';
import { Package, Search, ShoppingCart, Sun, Moon, Shield } from 'lucide-react';
import { CartItem } from '../types';

interface HeaderProps {
  currentView: 'catalog' | 'admin';
  setCurrentView: React.Dispatch<React.SetStateAction<'catalog' | 'admin'>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  cart: CartItem[];
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  isAdminAuthenticated: boolean;
  setIsAdminLoginOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLoginError: React.Dispatch<React.SetStateAction<string>>;
}

export function Header({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  cart,
  setIsCartOpen,
  isDarkMode,
  setIsDarkMode,
  isAdminAuthenticated,
  setIsAdminLoginOpen,
  setLoginError
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white flex-shrink-0">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Katalog Inventaris PSM UI Paragita</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ketersediaan Barang Paragita</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="Cari nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex-shrink-0"
              aria-label="Keranjang Peminjaman"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                  {cart.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={() => {
                if (currentView === 'catalog') {
                  if (isAdminAuthenticated) {
                    setCurrentView('admin');
                  } else {
                    setIsAdminLoginOpen(true);
                    setLoginError('');
                  }
                } else {
                  setCurrentView('catalog');
                }
              }}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label="Admin Dashboard"
              title="Admin Dashboard"
            >
              {currentView === 'catalog' ? <Shield size={20} /> : <Package size={20} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
