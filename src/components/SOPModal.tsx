import React from 'react';
import { FileText, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SOPModalProps {
  showSopModal: boolean;
  setShowSopModal: React.Dispatch<React.SetStateAction<boolean>>;
  sopAgreed: boolean;
  setSopAgreed: React.Dispatch<React.SetStateAction<boolean>>;
  processCheckoutWhatsApp: () => void;
}

export function SOPModal({
  showSopModal,
  setShowSopModal,
  sopAgreed,
  setSopAgreed,
  processCheckoutWhatsApp
}: SOPModalProps) {
  return (
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

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 shrink-0">
              <label className="flex items-start gap-3 cursor-pointer group mb-6">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input 
                    type="checkbox" 
                    className="peer sr-only"
                    checked={sopAgreed}
                    onChange={(e) => setSopAgreed(e.target.checked)}
                  />
                  <div className={`w-5 h-5 rounded border flex justify-center items-center transition-colors ${
                    sopAgreed 
                      ? 'bg-indigo-600 border-indigo-600' 
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-400 dark:group-hover:border-indigo-500 bg-white dark:bg-gray-800'
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
  );
}
