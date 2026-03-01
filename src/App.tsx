import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Package, Info, MapPin, Calendar, User, X, Sun, Moon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem, ItemStatus } from './types';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Mengambil data dari DatoCMS dengan API ID yang baru
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://graphql.datocms.com/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_DATOCMS_API_TOKEN}`,
          },
          body: JSON.stringify({
            // Query ini sudah disesuaikan persis dengan API ID di screenshot DatoCMS-mu
            query: `
              query {
                allInventoryItems {
                  id
                  name
                  category
                  statusItem
                  availablequantity
                  totalquantity
                  description
                  image {
                    url
                  }
                  location
                  borrowerinfo
                  expectedreturndate
                }
              }
            `
          }),
        });
        
        const result = await response.json();
        
        if (result.errors) {
          console.error("Error dari DatoCMS:", result.errors);
          setIsLoading(false);
          return;
        }

        // Menyambungkan data DatoCMS dengan kode tampilan
        const formattedData: InventoryItem[] = result.data.allInventoryItems.map((item: any) => ({
          id: item.id,
          name: item.name || 'Tanpa Nama',
          category: item.category || 'Lain-lain',
          status: item.statusItem || 'Tersedia',
          location: item.location || '-',
          imageUrl: item.image?.url || 'https://via.placeholder.com/400x300?text=Tidak+Ada+Foto',
          description: item.description || '', 
          availableQuantity: item.availablequantity || 0, 
          totalQuantity: item.totalquantity || 0,
          borrowerInfo: item.borrowerinfo || '',
          expectedReturnDate: item.expectedreturndate || '',
        }));
        
        setInventoryData(formattedData);
      } catch (error) {
        console.error("Gagal mengambil data dari DatoCMS:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = ['Semua', ...Array.from(new Set(inventoryData.map(item => item.category)))];

  const filteredItems = useMemo(() => {
    return inventoryData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, inventoryData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tersedia': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Dipinjam': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      case 'Pemeliharaan': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="min-h-screen font-sans pb-12 transition-colors duration-200 bg-white dark:bg-gray-950">
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
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Sedang mengambil data dari DatoCMS...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={item.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-shadow cursor-pointer flex flex-col"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="h-48 w-full relative bg-gray-100 dark:bg-gray-800">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">{item.category}</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-grow">{item.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <MapPin size={14}/> {item.location}
                      </div>
                      <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                        Detail &rarr;
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Barang tidak ditemukan</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Belum ada barang di kategori ini, atau kata kunci tidak cocok.</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white dark:bg-gray-900 md:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[100dvh] md:max-h-[90vh]"
            >
              <div className="relative h-64 md:h-72 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 dark:bg-black/40 dark:hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto flex-grow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">{selectedItem.category}</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedItem.name}</h2>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border whitespace-nowrap ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status}
                  </span>
                </div>

                {selectedItem.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {selectedItem.description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-start gap-3">
                    <Package className="text-gray-400 dark:text-gray-500 mt-0.5" size={20} />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Kuantitas</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedItem.availableQuantity} dari {selectedItem.totalQuantity} tersedia</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-start gap-3">
                    <MapPin className="text-gray-400 dark:text-gray-500 mt-0.5" size={20} />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Lokasi Penyimpanan</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedItem.location}</div>
                    </div>
                  </div>
                </div>

                {selectedItem.status !== 'Tersedia' && (
                  <div className={`p-4 rounded-xl border mb-8 ${
                    selectedItem.status === 'Dipinjam' 
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50' 
                      : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50'
                  }`}>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                      selectedItem.status === 'Dipinjam' ? 'text-amber-800 dark:text-amber-400' : 'text-rose-800 dark:text-rose-400'
                    }`}>
                      <Info size={16} />
                      Informasi {selectedItem.status}
                    </h4>
                    <div className="space-y-2">
                      {selectedItem.borrowerInfo && (
                        <div className="flex items-start gap-2 text-sm">
                          <User size={16} className={selectedItem.status === 'Dipinjam' ? 'text-amber-600 dark:text-amber-500' : 'text-rose-600 dark:text-rose-500'} />
                          <span className="text-gray-700 dark:text-gray-300">{selectedItem.borrowerInfo}</span>
                        </div>
                      )}
                      {selectedItem.expectedReturnDate && (
                        <div className="flex items-start gap-2 text-sm">
                          <Calendar size={16} className={selectedItem.status === 'Dipinjam' ? 'text-amber-600 dark:text-amber-500' : 'text-rose-600 dark:text-rose-500'} />
                          <span className="text-gray-700 dark:text-gray-300">Estimasi kembali: <span className="font-medium text-gray-900 dark:text-white">{new Date(selectedItem.expectedReturnDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cara Meminjam</h4>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Pastikan status barang <strong className="text-gray-900 dark:text-white">Tersedia</strong>.</li>
                    <li>Hubungi pengurus PSM divisi Rumah Tangga / Inventaris.</li>
                    <li>Klik tombol "Ajukan Peminjaman" di bawah untuk mengonfirmasi via WhatsApp.</li>
                    <li>Jaga barang dengan baik dan kembalikan tepat waktu.</li>
                  </ol>
                </div>
              </div>
              
              <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Tutup
                </button>
                <button 
                  disabled={selectedItem.status !== 'Tersedia'}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors ${
                    selectedItem.status === 'Tersedia'
                      ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                      : 'text-gray-400 bg-gray-200 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    const phoneNumber = "6281218795969"; 
                    const message = `Halo pengurus Invent, saya ingin meminjam barang berikut:\n\nNama Barang: *${selectedItem.name}*\nKategori: *${selectedItem.category}*\n\nMohon infokan lebih lanjut mengenai prosedurnya. Terima kasih.`;
                    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  Ajukan Peminjaman
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}