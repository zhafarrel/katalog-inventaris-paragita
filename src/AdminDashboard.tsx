import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, Wrench, Package, LogOut, Sun, Moon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InventoryItem } from './types';

export default function AdminDashboard({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean, setIsDarkMode: (val: boolean) => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simple password protection
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Ganti password sesuai kebutuhan
      setIsAuthenticated(true);
      fetchData();
    } else {
      setError('Password salah!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

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
          query: `
            query {
              allInventoryItems(first: 100) {
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

      const items = result.data?.allInventoryItems || [];
      const formattedData: InventoryItem[] = items.map((item: any) => ({
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

  // Metrics Logic
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lateItems = inventoryData.filter(item => {
      if (item.status !== 'Dipinjam' || !item.expectedReturnDate) return false;
      const returnDate = new Date(item.expectedReturnDate);
      return returnDate < today;
    });

    const maintenanceItems = inventoryData.filter(item => item.status === 'Pemeliharaan');
    
    // Asumsi batas aman adalah 20% dari total quantity atau kurang dari 2
    const lowStockItems = inventoryData.filter(item => {
      if (item.totalQuantity === 0) return false;
      return item.availableQuantity <= 2 || (item.availableQuantity / item.totalQuantity) <= 0.2;
    });

    // Data for chart: Items by Status
    const statusCounts = inventoryData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.keys(statusCounts).map(status => ({
      name: status,
      jumlah: statusCounts[status]
    }));

    return { lateItems, maintenanceItems, lowStockItems, chartData };
  }, [inventoryData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors duration-200">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full">
              <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Admin Dashboard</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">Masukkan password untuk mengakses panel BPH.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                required
              />
            </div>
            {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              Masuk
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft size={16} /> Kembali ke Katalog
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200 pb-12">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Dashboard BPH</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ringkasan Inventaris Paragita</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-2"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline text-sm font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Memuat data dashboard...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-rose-100 dark:border-rose-900/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Clock size={80} className="text-rose-500" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-rose-100 dark:bg-rose-900/30 p-2.5 rounded-xl">
                    <Clock className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Terlambat Kembali</h3>
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{metrics.lateItems.length}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Barang melewati batas waktu</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Wrench size={80} className="text-amber-500" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-xl">
                    <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Pemeliharaan</h3>
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{metrics.maintenanceItems.length}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Barang sedang diperbaiki</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <AlertTriangle size={80} className="text-indigo-500" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Stok Menipis</h3>
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{metrics.lowStockItems.length}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kuantitas di bawah batas aman</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Distribusi Status Barang</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <Tooltip 
                        cursor={{ fill: isDarkMode ? '#374151' : '#f3f4f6' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', color: isDarkMode ? '#ffffff' : '#111827' }}
                      />
                      <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
                        {metrics.chartData.map((entry, index) => {
                          let color = '#6366f1'; // Default indigo
                          if (entry.name === 'Tersedia') color = '#10b981'; // Emerald
                          if (entry.name === 'Dipinjam') color = '#f59e0b'; // Amber
                          if (entry.name === 'Pemeliharaan') color = '#f43f5e'; // Rose
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Action Needed List */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Perlu Perhatian</h3>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 max-h-72">
                  {metrics.lateItems.length === 0 && metrics.maintenanceItems.length === 0 && metrics.lowStockItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full mb-3">
                        <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm">Semua barang dalam kondisi baik dan aman.</p>
                    </div>
                  ) : (
                    <>
                      {metrics.lateItems.map(item => (
                        <div key={`late-${item.id}`} className="flex gap-3 p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <div className="mt-0.5"><Clock className="h-4 w-4 text-rose-500" /></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">Terlambat: {item.borrowerInfo}</p>
                          </div>
                        </div>
                      ))}
                      
                      {metrics.maintenanceItems.map(item => (
                        <div key={`maint-${item.id}`} className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                          <div className="mt-0.5"><Wrench className="h-4 w-4 text-amber-500" /></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Sedang Pemeliharaan</p>
                          </div>
                        </div>
                      ))}

                      {metrics.lowStockItems.map(item => (
                        <div key={`low-${item.id}`} className="flex gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                          <div className="mt-0.5"><AlertTriangle className="h-4 w-4 text-indigo-500" /></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Sisa {item.availableQuantity} dari {item.totalQuantity}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
