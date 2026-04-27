import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Package, Info, MapPin, Calendar, User, X, Sun, Moon, Loader2, ShoppingCart, Trash2, Shield, ArrowLeft, Clock, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem, ItemStatus, CartItem, BorrowLog } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'catalog' | 'admin'>('catalog');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('Semua');
  const [selectedGender, setSelectedGender] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<string>('Terbaru');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [quantityModalItem, setQuantityModalItem] = useState<InventoryItem | null>(null);
  const [quantityModalAction, setQuantityModalAction] = useState<'cart' | 'checkout' | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number | string>(1);
  const [tempBorrowerName, setTempBorrowerName] = useState<string>('');
  const [tempDivisi, setTempDivisi] = useState<string>('');
  const [tempKeperluan, setTempKeperluan] = useState<string>('');
  const [tempReturnDate, setTempReturnDate] = useState<string>('');
  
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Keranjang Peminjaman
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [returnConfirmData, setReturnConfirmData] = useState<{item: InventoryItem, logId: string} | null>(null);
  
  const [showSopModal, setShowSopModal] = useState(false);
  const [sopAgreed, setSopAgreed] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] = useState<{
    action: 'cart' | 'single';
    item?: InventoryItem;
    qty?: number;
    borrowerName?: string;
    divisi?: string;
    keperluan?: string;
    returnDate?: string;
  } | null>(null);

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

  useEffect(() => {
    if (quantityModalItem) {
      const cartItem = cart.find(i => i.id === quantityModalItem.id);
      if (cartItem) {
        setTempQuantity(cartItem.borrowQuantity);
        setTempBorrowerName(cartItem.borrowerName || tempBorrowerName);
        setTempDivisi(cartItem.divisi || tempDivisi);
        setTempKeperluan(cartItem.keperluan || tempKeperluan);
        setTempReturnDate(cartItem.returnDate || tempReturnDate);
      } else if (!quantityModalItem.allowPartialBorrowing && quantityModalItem.availableQuantity === quantityModalItem.totalQuantity) {
        setTempQuantity(quantityModalItem.totalQuantity);
      } else {
        setTempQuantity(1);
      }
    } else {
      setTempReturnDate('');
      setTempDivisi('');
      setTempKeperluan('');
    }
  }, [quantityModalItem, cart]);

  // Mengambil data dari DatoCMS
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let allItems: any[] = [];
        let skip = 0;
        const limit = 100; // Maksimal yang diizinkan DatoCMS per request biasanya 100
        let hasMore = true;

        while (hasMore) {
          const response = await fetch('https://graphql.datocms.com/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_DATOCMS_API_TOKEN}`,
            },
            body: JSON.stringify({
              query: `
                query {
                  allInventoryItems(first: ${limit}, skip: ${skip}) {
                    id
                    name
                    category
                    statusItem
                    availablequantity
                    totalquantity
                    description
                    gender
                    subcategory
                    image {
                      url
                    }
                    location
                    borrowerinfo
                    borrowdate
                    expectedreturndate
                  }
                  _allInventoryItemsMeta {
                    count
                  }
                }
              `
            }),
          });
          
          const result = await response.json();
          
          if (result.errors) {
            console.error("Error dari DatoCMS:", JSON.stringify(result.errors, null, 2));
            hasMore = false;
            break;
          }

          const fetchedItems = result.data?.allInventoryItems || [];
          allItems = [...allItems, ...fetchedItems];
          
          const totalCount = result.data?._allInventoryItemsMeta?.count || 0;
          skip += limit;
          
          if (skip >= totalCount) {
            hasMore = false;
          }
        }

        const formattedData: InventoryItem[] = allItems.map((item: any) => {
          let borrowLogs: BorrowLog[] = [];
          try {
            if (item.borrowerinfo && item.borrowerinfo.startsWith('[')) {
              borrowLogs = JSON.parse(item.borrowerinfo);
            } else if (item.borrowerinfo) {
              borrowLogs = [{
                id: Math.random().toString(36).substr(2, 9),
                borrowerName: item.borrowerinfo,
                quantity: item.totalquantity - item.availablequantity,
                borrowDate: item.borrowdate || '',
                expectedReturnDate: item.expectedreturndate || ''
              }];
            }
          } catch (e) {
            console.error("Failed to parse borrowerinfo", e);
            if (item.borrowerinfo) {
              borrowLogs = [{
                id: Math.random().toString(36).substr(2, 9),
                borrowerName: item.borrowerinfo,
                quantity: item.totalquantity - item.availablequantity,
                borrowDate: item.borrowdate || '',
                expectedReturnDate: item.expectedreturndate || ''
              }];
            }
          }

          return {
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
            borrowLogs,
            borrowDate: item.borrowdate || '',
            expectedReturnDate: item.expectedreturndate || '',
            allowPartialBorrowing: item.allowpartialborrowing !== false,
            subcategory: item.subcategory || (item.category?.trim().toUpperCase() === 'KOSTUM' ? (item.name.toLowerCase().includes('celana') ? 'Celana' : item.name.toLowerCase().includes('outer') ? 'Outer' : (item.name.toLowerCase().includes('kalung') || item.name.toLowerCase().includes('topi')) ? 'Aksesoris' : 'Baju') : undefined),
            gender: (item.gender === 'lakilaki' ? 'L' : item.gender === 'perempuan' ? 'P' : item.gender === 'genderless' ? undefined : item.gender) || ((item.category?.trim().toUpperCase() === 'KOSTUM' || item.category?.trim().toUpperCase() === 'AKSESORIS') ? ((item.name.toLowerCase().includes('pria') || item.name.toLowerCase().match(/\bcowok\b/i)) ? 'L' : (item.name.toLowerCase().includes('wanita') || item.name.toLowerCase().match(/\bcewek\b/i) || item.name.toLowerCase().includes('dress') || item.name.toLowerCase().includes('rok') || item.name.toLowerCase().includes('kebaya')) ? 'P' : undefined) : undefined),
          };
        });
        
        setInventoryData(formattedData);
      } catch (error) {
        console.error("Gagal mengambil data dari DatoCMS:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = ['Semua', 'Kostum', 'Aksesoris', 'Alat Musik', 'Penghargaan', 'Lain lain'];

  const availableSubcategories = useMemo(() => {
    const subs = new Set<string>();
    inventoryData.forEach(item => {
      if ((selectedCategory === 'Semua' || item.category?.toLowerCase().replace(/\s+/g, '') === selectedCategory.toLowerCase().replace(/\s+/g, '')) && item.subcategory) {
        const sub = item.subcategory.trim();
        subs.add(sub.charAt(0).toUpperCase() + sub.slice(1));
      }
    });
    return ['Semua', ...Array.from(subs).sort()];
  }, [inventoryData, selectedCategory]);

  const filteredItems = useMemo(() => {
    let result = inventoryData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'Semua' || item.category?.toLowerCase().replace(/\s+/g, '') === selectedCategory.toLowerCase().replace(/\s+/g, '');
      const matchesStatus = sortBy === 'Tersedia' ? item.status === 'Tersedia' : true;
      const matchesSubcategory = selectedSubcategory !== 'Semua' 
          ? item.subcategory?.toUpperCase() === selectedSubcategory.toUpperCase() 
          : true;
      const matchesGender = (selectedCategory.trim().toUpperCase() === 'KOSTUM' || selectedCategory.trim().toUpperCase() === 'AKSESORIS') && selectedGender !== 'Semua'
          ? (selectedGender === 'Laki-laki' ? item.gender === 'L' : selectedGender === 'Perempuan' ? item.gender === 'P' : selectedGender === 'Genderless' ? !item.gender : true)
          : true;

      return matchesSearch && matchesCategory && matchesStatus && matchesSubcategory && matchesGender;
    });

    if (sortBy === 'A-Z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'Z-A') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedGender, inventoryData, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tersedia': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Dipinjam': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      case 'Pemeliharaan': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  // Fungsi untuk menambah/menghapus barang dari keranjang
  const toggleCartItem = (item: InventoryItem) => {
    if (cart.find(i => i.id === item.id)) {
      setCart(cart.filter(i => i.id !== item.id));
    } else {
      handleActionWithQuantity(item, 'cart');
    }
  };

  const handleActionWithQuantity = (item: InventoryItem, action: 'cart' | 'checkout') => {
    setQuantityModalItem(item);
    setQuantityModalAction(action);
    if (!item.allowPartialBorrowing) {
      setTempQuantity(item.totalQuantity);
    } else {
      setTempQuantity(1);
    }
  };

  const updateDatoCMSItem = async (
    itemId: string,
    newAvailableQty: number,
    newStatus: string,
    borrowerName: string,
    borrowDate: string | null,
    expectedReturnDate: string | null
  ) => {
    try {
      // 1. Update the item (creates a draft)
      const response = await fetch(`https://site-api.datocms.com/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_DATOCMS_API_TOKEN}`,
          'X-Api-Version': '3',
          'Accept': 'application/json',
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          data: {
            id: itemId,
            type: 'item',
            attributes: {
              availablequantity: newAvailableQty,
              status_item: newStatus,
              borrowerinfo: borrowerName,
              borrowdate: borrowDate,
              expectedreturndate: expectedReturnDate
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gagal update DatoCMS:", JSON.stringify(errorData, null, 2));
        
        // Coba fallback jika nama fieldnya berbeda (tanpa underscore)
        if (errorData.data && errorData.data.some((e: any) => e.attributes?.details?.invalid_attributes?.includes('status_item'))) {
           console.log("Mencoba update ulang dengan nama field alternatif...");
           await fetch(`https://site-api.datocms.com/items/${itemId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_DATOCMS_API_TOKEN}`,
              'X-Api-Version': '3',
              'Accept': 'application/json',
              'Content-Type': 'application/vnd.api+json'
            },
            body: JSON.stringify({
              data: {
                id: itemId,
                type: 'item',
                attributes: {
                  availablequantity: newAvailableQty,
                  statusitem: newStatus,
                  borrowerinfo: borrowerName,
                  borrowdate: borrowDate,
                  expectedreturndate: expectedReturnDate
                }
              }
            })
          });
        }
      } else {
        console.log(`Berhasil update item ${itemId} di DatoCMS!`);
      }

      // 2. Publish the item so it appears in the public GraphQL API
      const publishResponse = await fetch(`https://site-api.datocms.com/items/${itemId}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_DATOCMS_API_TOKEN}`,
          'X-Api-Version': '3',
          'Accept': 'application/json'
        }
      });

      if (!publishResponse.ok) {
        const publishError = await publishResponse.json();
        console.error("Gagal publish DatoCMS:", publishError);
      } else {
        console.log(`Berhasil publish item ${itemId}!`);
      }

    } catch (error) {
      console.error("Terjadi kesalahan jaringan saat update DatoCMS:", error);
    }
  };

  const handleReturnItem = (item: InventoryItem, logId: string) => {
    setReturnConfirmData({ item, logId });
  };

  const confirmReturnAction = async () => {
    if (!returnConfirmData) return;
    
    const { item, logId } = returnConfirmData;
    // Update local inventory data
    const updatedInventory = inventoryData.map(i => {
      if (i.id === item.id) {
        const logToRemove = i.borrowLogs?.find(l => l.id === logId);
        if (!logToRemove) return i;

        const newAvailable = Math.min(i.totalQuantity, i.availableQuantity + logToRemove.quantity);
        const newStatus = newAvailable === 0 ? 'Dipinjam' : 'Tersedia';
        const newBorrowLogs = i.borrowLogs?.filter(l => l.id !== logId) || [];
        const newBorrowerInfoString = newBorrowLogs.length > 0 ? JSON.stringify(newBorrowLogs) : '';
        const latestLog = newBorrowLogs.length > 0 ? newBorrowLogs[newBorrowLogs.length - 1] : null;
        
        // Update to DatoCMS
        updateDatoCMSItem(
          item.id,
          newAvailable,
          newStatus,
          newBorrowerInfoString,
          latestLog ? latestLog.borrowDate : null,
          latestLog ? latestLog.expectedReturnDate : null
        );
        
        return {
          ...i,
          availableQuantity: newAvailable,
          status: newStatus,
          borrowerInfo: newBorrowerInfoString,
          borrowLogs: newBorrowLogs,
          borrowDate: latestLog ? latestLog.borrowDate : '',
          expectedReturnDate: latestLog ? latestLog.expectedReturnDate : '',
        };
      }
      return i;
    });
    setInventoryData(updatedInventory);
    setReturnConfirmData(null);
  };

  const confirmQuantityAction = () => {
    if (!quantityModalItem || !quantityModalAction) return;
    
    if (!tempBorrowerName.trim()) {
      alert("Mohon isi nama peminjam terlebih dahulu.");
      return;
    }
    
    if (!tempDivisi.trim()) {
      alert("Mohon isi nama divisi terlebih dahulu.");
      return;
    }
    
    if (!tempKeperluan.trim()) {
      alert("Mohon isi keperluan penggunaan terlebih dahulu.");
      return;
    }
    
    if (!tempReturnDate) {
      alert("Mohon isi tanggal pengembalian terlebih dahulu.");
      return;
    }
    
    const qty = typeof tempQuantity === 'number' ? tempQuantity : parseInt(tempQuantity, 10) || 1;
    const finalQty = Math.max(1, Math.min(quantityModalItem.availableQuantity, qty));

    if (quantityModalAction === 'cart') {
      if (!cart.some(i => i.id === quantityModalItem.id)) {
        setCart([...cart, { ...quantityModalItem, borrowQuantity: finalQty, borrowerName: tempBorrowerName, divisi: tempDivisi, keperluan: tempKeperluan, returnDate: tempReturnDate }]);
      } else {
        setCart(cart.map(i => i.id === quantityModalItem.id ? { ...i, borrowQuantity: finalQty, borrowerName: tempBorrowerName, divisi: tempDivisi, keperluan: tempKeperluan, returnDate: tempReturnDate } : i));
      }
      setQuantityModalItem(null);
      setQuantityModalAction(null);
    } else {
      setPendingCheckoutData({
        action: 'single',
        item: quantityModalItem,
        qty: finalQty,
        borrowerName: tempBorrowerName,
        divisi: tempDivisi,
        keperluan: tempKeperluan,
        returnDate: tempReturnDate
      });
      setShowSopModal(true);
      setQuantityModalItem(null);
      setQuantityModalAction(null);
    }
  };

  // Fungsi untuk checkout via WhatsApp
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setPendingCheckoutData({
      action: 'cart'
    });
    setShowSopModal(true);
  };

  const processCheckoutWhatsApp = () => {
    if (!pendingCheckoutData) return;

    if (pendingCheckoutData.action === 'single') {
      const { item: quantityModalItem, qty: finalQty, borrowerName: tempBorrowerName, divisi: tempDivisi, keperluan: tempKeperluan, returnDate: tempReturnDate } = pendingCheckoutData;
      if (!quantityModalItem || !finalQty || !tempBorrowerName || !tempDivisi || !tempKeperluan || !tempReturnDate) return;

      const phoneNumber = "6281218795969";
      
      // Format return date nicely if possible
      let formattedReturnDate = tempReturnDate;
      try {
        const d = new Date(tempReturnDate);
        if (!isNaN(d.getTime())) {
          formattedReturnDate = d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
      } catch (e) {}
      
      const message = `Halo pengurus Invent, saya ingin meminjam barang berikut:\n\nNama Peminjam: *${tempBorrowerName}*\nDivisi: *${tempDivisi}*\nNama Barang: *${quantityModalItem.name}*\nJumlah: *${finalQty} buah*\nKategori: *${quantityModalItem.category}*\nKeperluan: *${tempKeperluan}*\nTanggal Pengembalian: *${formattedReturnDate}*\n\nMohon infokan lebih lanjut mengenai prosedurnya. Terima kasih.`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      // Update local inventory data to reflect the borrowing
      const borrowDate = new Date().toISOString();
      const expectedReturnDate = new Date(tempReturnDate).toISOString();
      
      const updatedInventory = inventoryData.map(item => {
        if (item.id === quantityModalItem.id) {
          const newAvailable = item.availableQuantity - finalQty;
          const newStatus = newAvailable === 0 ? 'Dipinjam' : 'Tersedia';
          
          const newLog: BorrowLog = {
            id: Math.random().toString(36).substr(2, 9),
            borrowerName: tempBorrowerName,
            divisi: tempDivisi,
            keperluan: tempKeperluan,
            quantity: finalQty,
            borrowDate: borrowDate,
            expectedReturnDate: expectedReturnDate
          };
          const newBorrowLogs = [...(item.borrowLogs || []), newLog];
          const newBorrowerInfoString = JSON.stringify(newBorrowLogs);
          
          // Update to DatoCMS
          updateDatoCMSItem(
            item.id,
            newAvailable,
            newStatus,
            newBorrowerInfoString,
            borrowDate,
            expectedReturnDate
          );
          
          return {
            ...item,
            availableQuantity: newAvailable,
            status: newStatus,
            borrowerInfo: newBorrowerInfoString,
            borrowLogs: newBorrowLogs,
            borrowDate: borrowDate,
            expectedReturnDate: expectedReturnDate,
          };
        }
        return item;
      });
      setInventoryData(updatedInventory);
      
      window.open(whatsappUrl, '_blank');
    } else if (pendingCheckoutData.action === 'cart') {
      const phoneNumber = "6281218795969"; 
      const borrowerName = cart[0].borrowerName || "Peminjam";
      const divisi = cart[0].divisi || "-";
      const keperluan = cart[0].keperluan || "-";
      const itemList = cart.map((item, index) => {
        let returnDateStr = item.returnDate || '';
        try {
          if (returnDateStr) {
            const d = new Date(returnDateStr);
            if (!isNaN(d.getTime())) {
              returnDateStr = d.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            }
          }
        } catch(e) {}
        return `${index + 1}. *${item.name}* (${item.borrowQuantity} buah) - Pengembalian: ${returnDateStr}`;
      }).join('\n');
      const message = `Halo pengurus Invent, saya *${borrowerName}* dari divisi *${divisi}* ingin meminjam barang-barang berikut untuk keperluan *${keperluan}*:\n\n${itemList}\n\nMohon infokan lebih lanjut mengenai prosedurnya. Terima kasih.`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      // Update local inventory data to reflect the borrowing
      const updatedInventory = [...inventoryData];
      const borrowDate = new Date().toISOString();
      
      cart.forEach(cartItem => {
        const index = updatedInventory.findIndex(i => i.id === cartItem.id);
        if (index !== -1) {
          const item = updatedInventory[index];
          const newAvailable = item.availableQuantity - cartItem.borrowQuantity;
          const newStatus = newAvailable === 0 ? 'Dipinjam' : 'Tersedia';
          const finalBorrowerName = cartItem.borrowerName || borrowerName;
          const expectedReturnDate = cartItem.returnDate ? new Date(cartItem.returnDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          
          const finalDivisi = cartItem.divisi || divisi;
          const finalKeperluan = cartItem.keperluan || keperluan;
          
          const newLog: BorrowLog = {
            id: Math.random().toString(36).substr(2, 9),
            borrowerName: finalBorrowerName,
            divisi: finalDivisi,
            keperluan: finalKeperluan,
            quantity: cartItem.borrowQuantity,
            borrowDate: borrowDate,
            expectedReturnDate: expectedReturnDate
          };
          const newBorrowLogs = [...(item.borrowLogs || []), newLog];
          const newBorrowerInfoString = JSON.stringify(newBorrowLogs);
          
          // Update to DatoCMS
          updateDatoCMSItem(
            item.id,
            newAvailable,
            newStatus,
            newBorrowerInfoString,
            borrowDate,
            expectedReturnDate
          );
          
          updatedInventory[index] = {
            ...item,
            availableQuantity: newAvailable,
            status: newStatus,
            borrowerInfo: newBorrowerInfoString,
            borrowLogs: newBorrowLogs,
            borrowDate: borrowDate,
            expectedReturnDate: expectedReturnDate,
          };
        }
      });
      setInventoryData(updatedInventory);
      setCart([]);
      setIsCartOpen(false);
      
      window.open(whatsappUrl, '_blank');
    }

    setShowSopModal(false);
    setSopAgreed(false);
    setPendingCheckoutData(null);
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'admin' ? (
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
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedSubcategory('Semua');
                      setSelectedGender('Semua');
                    }}
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
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2 transition-colors outline-none cursor-pointer"
                >
                  <option value="Terbaru">Terbaru</option>
                  <option value="A-Z">A - Z</option>
                  <option value="Z-A">Z - A</option>
                  <option value="Tersedia">Hanya yang Tersedia</option>
                </select>
              </div>
            </div>

            {(availableSubcategories.length > 1 || selectedCategory.trim().toUpperCase() === 'KOSTUM' || selectedCategory.trim().toUpperCase() === 'AKSESORIS') && (
              <div className="flex flex-col gap-3 mb-6 -mt-2">
                {availableSubcategories.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-1 flex-shrink-0 font-medium">Jenis:</span>
                    {availableSubcategories.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubcategory(sub)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          selectedSubcategory === sub
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
                
                {(selectedCategory.trim().toUpperCase() === 'KOSTUM' || selectedCategory.trim().toUpperCase() === 'AKSESORIS') && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-1 flex-shrink-0 font-medium">Gender:</span>
                    {['Semua', 'Laki-laki', 'Perempuan', 'Genderless'].map(gen => (
                      <button
                        key={gen}
                        onClick={() => setSelectedGender(gen)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          selectedGender === gen
                            ? (gen === 'Laki-laki' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : gen === 'Perempuan' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 border border-pink-200 dark:border-pink-800' : gen === 'Genderless' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800')
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {gen}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Sedang mengambil data dari DatoCMS...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredItems.map((item) => {
                const isInCart = cart.some(i => i.id === item.id);
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={item.id}
                    className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-shadow cursor-pointer flex flex-col ${
                      isInCart ? 'border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-800'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="h-48 w-full relative bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {(item.category?.trim().toUpperCase() === 'KOSTUM' || item.category?.trim().toUpperCase() === 'AKSESORIS') && item.gender && (
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md backdrop-blur-sm bg-opacity-90 ${item.gender === 'L' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                            {item.gender}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        {isInCart && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border border-indigo-200 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/80 dark:border-indigo-700 dark:text-indigo-300 backdrop-blur-sm flex items-center gap-1">
                            <ShoppingCart size={12} /> Di Keranjang
                          </span>
                        )}
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
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Barang tidak ditemukan</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Belum ada barang di kategori ini, atau kata kunci tidak cocok.</p>
          </div>
        )}
        </>
        )}
      </main>

      {/* Modal Detail Barang */}
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
              className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-4xl bg-white dark:bg-gray-900 md:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col md:flex-row max-h-[100dvh] md:max-h-[85vh]"
            >
              <div className="relative h-64 md:h-auto md:w-1/2 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {(selectedItem.category?.trim().toUpperCase() === 'KOSTUM' || selectedItem.category?.trim().toUpperCase() === 'AKSESORIS') && selectedItem.gender && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg backdrop-blur-sm bg-opacity-90 ${selectedItem.gender === 'L' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                      {selectedItem.gender}
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 md:hidden p-2 bg-black/20 hover:bg-black/40 dark:bg-black/40 dark:hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col md:w-1/2 overflow-hidden relative">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="hidden md:flex absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <div className="p-6 md:p-8 overflow-y-auto flex-grow">
                  <div className="flex items-start justify-between gap-4 mb-4 pr-8">
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

                  <div className="grid grid-cols-1 gap-4 mb-8 mt-4">
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

                  {selectedItem.status === 'Tersedia' && !selectedItem.allowPartialBorrowing && selectedItem.availableQuantity < selectedItem.totalQuantity && (
                    <div className="mt-6 mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                      <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800/50">
                        Barang ini harus dipinjam satu set utuh ({selectedItem.totalQuantity} buah), namun saat ini ada bagian yang sedang dipinjam.
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cara Meminjam</h4>
                    <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                      <li>Pastikan status barang <strong className="text-gray-900 dark:text-white">Tersedia</strong>.</li>
                      <li>Klik tombol "Tambah ke Keranjang" di bawah atau "Tentukan Jumlah" jika ingin meminjam lebih dari 1.</li>
                      <li>Isi form data secara lengkap.</li>
                      <li>Buka Keranjang di pojok kanan atas untuk melihat daftar barang yang akan dipinjam.</li>
                      <li>Klik "Ajukan Peminjaman via WA" dan setujui SOP Peminjaman.</li>
                    </ol>
                  </div>
                </div>
                
                <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 flex-shrink-0">
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Tutup
                  </button>
                  <button 
                    disabled={selectedItem.status !== 'Tersedia' || (!selectedItem.allowPartialBorrowing && selectedItem.availableQuantity < selectedItem.totalQuantity)}
                    className={`p-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center justify-center ${
                      selectedItem.status !== 'Tersedia' || (!selectedItem.allowPartialBorrowing && selectedItem.availableQuantity < selectedItem.totalQuantity)
                        ? 'text-gray-400 bg-gray-200 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                        : cart.some(i => i.id === selectedItem.id)
                          ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50'
                          : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50'
                    }`}
                    onClick={() => toggleCartItem(selectedItem)}
                    title={cart.some(i => i.id === selectedItem.id) ? "Hapus dari Keranjang" : "Tambah ke Keranjang"}
                  >
                    <ShoppingCart size={20} />
                  </button>
                  <button 
                    disabled={selectedItem.status !== 'Tersedia' || (!selectedItem.allowPartialBorrowing && selectedItem.availableQuantity < selectedItem.totalQuantity)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors ${
                      selectedItem.status === 'Tersedia' && !(!selectedItem.allowPartialBorrowing && selectedItem.availableQuantity < selectedItem.totalQuantity)
                        ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                        : 'text-gray-400 bg-gray-200 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      handleActionWithQuantity(selectedItem, 'checkout');
                      setSelectedItem(null);
                    }}
                  >
                    Ajukan Peminjaman
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Pilih Jumlah Peminjaman */}
      <AnimatePresence>
        {quantityModalItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => {
                setQuantityModalItem(null);
                setQuantityModalAction(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="text-indigo-600 dark:text-indigo-400" size={24} />
                  Jumlah Peminjaman
                </h2>
                <button 
                  onClick={() => {
                    setQuantityModalItem(null);
                    setQuantityModalAction(null);
                  }}
                  className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto styled-scrollbars flex-grow">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={quantityModalItem.imageUrl} alt={quantityModalItem.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{quantityModalItem.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tersedia: {quantityModalItem.availableQuantity} buah</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Peminjam
                      </label>
                      <input 
                        type="text" 
                        value={tempBorrowerName}
                        onChange={(e) => setTempBorrowerName(e.target.value)}
                        placeholder="Masukkan nama Anda"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Divisi
                      </label>
                      <input 
                        type="text" 
                        value={tempDivisi}
                        onChange={(e) => setTempDivisi(e.target.value)}
                        placeholder="Masukkan divisi Anda"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Keperluan Penggunaan
                      </label>
                      <input 
                        type="text" 
                        value={tempKeperluan}
                        onChange={(e) => setTempKeperluan(e.target.value)}
                        placeholder="Misal: Penampilan konser, Lomba, dll"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tanggal Pengembalian
                      </label>
                      <input 
                        type="date" 
                        value={tempReturnDate}
                        onChange={(e) => setTempReturnDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>

                    {quantityModalItem.allowPartialBorrowing ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tentukan Jumlah
                          </label>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setTempQuantity(1)}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              Min
                            </button>
                            <input 
                              type="number" 
                              min="1"
                              max={quantityModalItem.availableQuantity}
                              value={tempQuantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  setTempQuantity('');
                                } else {
                                  const num = parseInt(val, 10);
                                  if (!isNaN(num)) {
                                    setTempQuantity(Math.max(1, Math.min(quantityModalItem.availableQuantity, num)));
                                  }
                                }
                              }}
                              onBlur={() => {
                                if (tempQuantity === '' || isNaN(Number(tempQuantity))) {
                                  setTempQuantity(1);
                                }
                              }}
                              className="flex-grow px-4 py-2 text-center text-lg font-bold border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                            />
                            <button 
                              onClick={() => setTempQuantity(quantityModalItem.availableQuantity)}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              Max
                            </button>
                          </div>
                        </div>

                        <div>
                          <input 
                            type="range" 
                            min="1" 
                            max={quantityModalItem.availableQuantity} 
                            value={tempQuantity === '' ? 1 : tempQuantity} 
                            onChange={(e) => setTempQuantity(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>1</span>
                            <span>{quantityModalItem.availableQuantity}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800/50">
                        Barang ini harus dipinjam satu set utuh ({quantityModalItem.totalQuantity} buah).
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setQuantityModalItem(null);
                      setQuantityModalAction(null);
                    }}
                    className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmQuantityAction}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Konfirmasi
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Keranjang Peminjaman */}
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

      {/* Modal Login Admin */}
      <AnimatePresence>
        {isAdminLoginOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsAdminLoginOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
                    Login Admin
                  </h2>
                  <button 
                    onClick={() => setIsAdminLoginOpen(false)}
                    className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (adminUsername === 'admin' && adminPassword === 'inventaris2026') {
                    setIsAdminAuthenticated(true);
                    setIsAdminLoginOpen(false);
                    setCurrentView('admin');
                    setAdminUsername('');
                    setAdminPassword('');
                    setLoginError('');
                  } else {
                    setLoginError('Username atau password salah!');
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                    <input 
                      type="text" 
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      placeholder="Masukkan username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                    <input 
                      type="password" 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      placeholder="Masukkan password"
                      required
                    />
                  </div>
                  
                  {loginError && (
                    <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800/50">
                      {loginError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Masuk
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus Log */}
      <AnimatePresence>
        {returnConfirmData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setReturnConfirmData(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trash2 className="text-rose-600 dark:text-rose-400" size={24} />
                    Konfirmasi Hapus Log
                  </h2>
                  <button 
                    onClick={() => setReturnConfirmData(null)}
                    className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-300">
                    Apakah Anda yakin ingin menghapus log peminjaman untuk barang <strong>"{returnConfirmData.item.name}"</strong>?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Data peminjam akan dihapus dan barang akan kembali tersedia. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setReturnConfirmData(null)}
                    className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmReturnAction}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Ya, Hapus Log
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal SOP Peminjaman */}
      <AnimatePresence>
        {showSopModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSopModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-100 dark:border-gray-800"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-indigo-600 dark:text-indigo-400" size={24} />
                  SOP Peminjaman
                </h2>
                <button 
                  onClick={() => setShowSopModal(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto grow">
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center uppercase">SOP Peminjaman</h3>
                  <p className="mb-4 text-justify">Sebagai bentuk tertib administrasi dan tanggung jawab dalam penggunaan aset UKM Paduan Suara Mahasiswa Paragita, setiap anggota yang ingin meminjam inventory wajib mengikuti ketentuan berikut:</p>
                  
                  <ol className="list-decimal pl-4 space-y-4 mb-8 text-justify">
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Pengajuan Peminjaman</strong>
                      <p className="mt-1">Peminjaman dilakukan secara online melalui website Inventory Paragita yang telah disediakan oleh Divisi Inventory. Peminjam wajib membuat pengajuan dan memastikan data peminjaman diisi secara lengkap sesuai kebutuhan kegiatan.</p>
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Informasi yang Dicantumkan</strong>
                      <p className="mt-1">Pada saat melakukan proses pengajuan di website, peminjam wajib mencantumkan:</p>
                      <ul className="list-[lower-alpha] pl-4 mt-1 space-y-1">
                        <li>Nama dan divisi</li>
                        <li>Nama barang dan jumlah yang dipinjam</li>
                        <li>Keperluan penggunaan</li>
                        <li>Tanggal peminjaman dan tanggal pengembalian</li>
                      </ul>
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Persetujuan dan Konfirmasi</strong>
                      <p className="mt-1">Setelah pengajuan berhasil dibuat di website, Divisi Inventory akan melakukan pengecekan ketersediaan barang. Peminjaman dinyatakan sah setelah mendapatkan konfirmasi persetujuan.</p>
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Pengambilan Barang</strong>
                      <p className="mt-1">Barang dapat diambil sesuai waktu yang telah disepakati dengan Admin/Divisi Inventory. Pada saat pengambilan, peminjam wajib memeriksa kondisi dan kelengkapan barang.</p>
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Tanggung Jawab Peminjam</strong>
                      <p className="mt-1">Selama masa peminjaman, peminjam bertanggung jawab atas keamanan, kondisi, dan kelengkapan barang hingga waktu pengembalian sesuai ketentuan yang berlaku.</p>
                    </li>
                  </ol>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-8 text-center uppercase">SOP Pengembalian</h3>
                  <p className="mb-4 text-justify">Sebagai bentuk tanggung jawab bersama dalam menjaga aset UKM Paduan Suara Mahasiswa Paragita, setiap inventory yang telah dipinjam melalui website wajib dikembalikan sesuai ketentuan berikut:</p>
                  
                  <ol className="list-decimal pl-4 space-y-4 text-justify">
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Waktu Pengembalian</strong>
                      <p className="mt-1">Barang dikembalikan sesuai tanggal yang tertera pada form peminjaman. Jika membutuhkan perpanjangan, peminjam wajib menghubungi Admin/Divisi Inventory sebelum masa pinjam berakhir.</p>
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Kondisi Barang</strong>
                      <p className="mt-1">Sebelum dikembalikan, pastikan barang:</p>
                      <ul className="list-[lower-alpha] pl-4 mt-1 space-y-1">
                        <li>Dalam keadaan bersih dan layak pakai</li>
                        <li>Lengkap sesuai saat diterima</li>
                        <li>Tidak tertukar atau tercecer komponennya</li>
                      </ul>
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Serah Terima dan Pengecekan</strong>
                      <p className="mt-1">Pengembalian dilakukan langsung kepada Admin/Divisi Inventory. Akan dilakukan pengecekan singkat terkait kondisi dan kelengkapan barang. Pengembalian dianggap selesai setelah dinyatakan diterima.</p>
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Konfirmasi Administrasi</strong>
                      <p className="mt-1">Status pengembalian akan dicatat dalam rekap inventory. Jika diperlukan, peminjam juga wajib mengisi Google Form Pengembalian yang telah disediakan.</p>
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Kerusakan, Kehilangan, dan Keterlambatan</strong>
                      <p className="mt-1">Segala bentuk kerusakan atau kehilangan wajib dilaporkan. Peminjam bertanggung jawab sesuai ketentuan yang berlaku. Keterlambatan tanpa konfirmasi akan dicatat sebagai pelanggaran administrasi.</p>
                    </li>
                  </ol>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <label className="flex items-start gap-3 cursor-pointer group mb-4">
                  <div className="relative flex items-center justify-center mt-1">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={sopAgreed}
                      onChange={(e) => setSopAgreed(e.target.checked)}
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      sopAgreed 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'bg-white border-gray-300 dark:border-gray-600 group-hover:border-indigo-500 shadow-sm'
                    }`}>
                      {sopAgreed && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 select-none">
                    Saya telah membaca, memahami, dan menyetujui seluruh ketentuan dalam SOP Peminjaman di atas.
                  </span>
                </label>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSopModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={processCheckoutWhatsApp}
                    disabled={!sopAgreed}
                    className={`flex-[2] px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-all shadow-sm ${
                      sopAgreed 
                        ? 'bg-green-600 hover:bg-green-700 hover:shadow-md active:scale-[0.98]' 
                        : 'bg-green-400/50 cursor-not-allowed'
                    }`}
                  >
                    Lanjut ke WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
