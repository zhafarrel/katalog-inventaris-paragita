import React from 'react';
import { Shield, Package, ArrowLeft } from 'lucide-react';
import { InventoryItem } from '../types';

interface AdminLogViewProps {
  currentView: 'catalog' | 'admin';
  setCurrentView: React.Dispatch<React.SetStateAction<'catalog' | 'admin'>>;
  inventoryData: InventoryItem[];
  handleReturnItem: (item: InventoryItem, logId: string) => void;
}

export function AdminLogView({
  currentView,
  setCurrentView,
  inventoryData,
  handleReturnItem
}: AdminLogViewProps) {
  if (currentView !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log Peminjaman</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Daftar barang yang sedang dipinjam saat ini.</p>
        </div>
        <button
          onClick={() => setCurrentView('catalog')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Katalog
        </button>
      </div>

      {inventoryData.flatMap(item => (item.borrowLogs || []).map(log => ({ item, log }))).length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
          Tidak ada barang yang sedang dipinjam.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryData
            .flatMap(item => (item.borrowLogs || []).map(log => ({ item, log })))
            .map(({ item, log }) => (
              <div key={`${item.id}-${log.id}`} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                {/* Header: Item details */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h3>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase truncate block">{item.category}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700`}>
                    {log.quantity} dipinjam
                  </span>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>
                
                {/* Body: Borrower details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Peminjam</p>
                    <p className="font-medium text-gray-900 dark:text-white truncate" title={log.borrowerName || '-'}>{log.borrowerName || '-'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Divisi</p>
                    <p className="font-medium text-gray-900 dark:text-white truncate" title={log.divisi || '-'}>{log.divisi || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Keperluan</p>
                    <p className="font-medium text-gray-900 dark:text-white line-clamp-2" title={log.keperluan || '-'}>{log.keperluan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tgl Pinjam</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {log.borrowDate ? new Date(log.borrowDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Estimasi Kembali</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {log.expectedReturnDate ? new Date(log.expectedReturnDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
                
                {/* Footer: Actions */}
                <div className="mt-auto pt-2 flex justify-end">
                  <button
                    onClick={() => handleReturnItem(item, log.id)}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors w-full text-center"
                  >
                    Hapus Log / Barang Kembali
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
