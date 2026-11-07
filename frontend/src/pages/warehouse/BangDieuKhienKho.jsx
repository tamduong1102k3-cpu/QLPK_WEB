import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAllThuocApi, getAllKhoApi, getAllPhieuNhapApi, getChiTietPhieuNhapApi, getKhoCanhBaoApi } from '../../api/khoThuocApi';
import { getAllNhanVienApi } from '../../api/employeeApi';
import UserMenu from '../../components/UserMenu';
import LichLamViecTab from '../../components/LichLamViecTab';
import { useNotification } from '../../components/NotificationContext';
import LichSuNhapThuoc from './components/LichSuNhapThuoc';
import KhoThuocTab from '../admin/components/KhoThuocTab';
import PhieuNhapTab, { suppliers } from '../admin/components/PhieuNhapTab';
import useWebSocket from '../../hooks/useWebSocket';
import NotificationBell from '../../components/NotificationBell';

const BangDieuKhienKho = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [sidebarWidth, setSidebarWidth] = useState(256); // w-64 is 256px
  const isResizing = useRef(false);
  const [inventory, setInventory] = useState([]);
  const [phieuNhapList, setPhieuNhapList] = useState([]);
  const [allThuoc, setAllThuoc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [alertStats, setAlertStats] = useState({ binhThuong: 0, sapHet: 0, canhBao: 0, hetHang: 0 });
  const [nvMap, setNvMap] = useState({});
  const { showSuccess, showError, bellNotifications, addBellNotification, markBellAsRead, markAllBellAsRead, clearAllBell } = useNotification();
  const lastHandledRef = useRef({ maPhieu: null, ts: 0 });

  // ── Modal xem chi tiết ──
  const [detailModal, setDetailModal] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [khoData, thuocData, phieuData, nvData] = await Promise.all([
        getAllKhoApi(),
        getAllThuocApi(),
        getAllPhieuNhapApi(),
        getAllNhanVienApi().catch(() => []),
      ]);
      setInventory(khoData || []);
      setAllThuoc(thuocData || []);
      setPhieuNhapList(phieuData || []);
      const nv = {};
      (nvData || []).forEach(n => { nv[n.maNhanVien] = n.hoTen; });
      setNvMap(nv);
    } catch (err) {
      console.error("Error fetching warehouse data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Also refresh when refreshTrigger changes (from PhieuNhapTab calls)
  useEffect(() => {
    if (refreshTrigger > 0) fetchData();
  }, [refreshTrigger]);

  // Fetch alert data
  const fetchAlertData = useCallback(async () => {
    try {
      const data = await getKhoCanhBaoApi();
      if (data) {
        setAlertStats({
          binhThuong: data.filter(i => i.trangThai === 'BÌNH_THƯỜNG').length,
          sapHet: data.filter(i => i.trangThai === 'SẮP_HẾT').length,
          canhBao: data.filter(i => i.trangThai === 'CẢNH_BÁO').length,
          hetHang: data.filter(i => i.trangThai === 'HẾT_HÀNG').length,
        });
      }
    } catch (err) {
      console.error("Error fetching alert data:", err);
    }
  }, []);

  useEffect(() => { fetchAlertData(); }, [fetchAlertData]);

  const [thuocMap, setThuocMap] = useState({});

  // Build lookup map for thuoc data
  useEffect(() => {
    const map = {};
    (allThuoc || []).forEach(t => {
      map[t.maThuoc] = t;
    });
    setThuocMap(map);
  }, [allThuoc]);

  const handleViewDetail = async (phieu) => {
    setDetailModal(phieu);
    setDetailLoading(true);
    try {
      const items = await getChiTietPhieuNhapApi(phieu.maPhieuNhapThuoc);
      setDetailItems(items || []);
    } catch (e) {
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const getTenThuoc = (maThuoc) => {
    const t = thuocMap[maThuoc];
    return t ? t.tenThuoc : `#${maThuoc}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  const formatDateTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // WebSocket subscription for realtime inventory updates and alerts
  useWebSocket({
    topics: ['/topic/phieu-nhap', '/topic/kho-thuoc', '/topic/kho-alert'],
    onMessage: (topic, data) => {
      if (topic === '/topic/phieu-nhap') {
        const now = Date.now();
        if (
          lastHandledRef.current.maPhieu === data.maPhieuNhapThuoc &&
          now - lastHandledRef.current.ts < 2000
        ) {
          return;
        }
        lastHandledRef.current = { maPhieu: data.maPhieuNhapThuoc, ts: now };

        addBellNotification({
          id: Date.now() + Math.random(),
          title: 'Nhập kho thành công',
          message: `Phiếu nhập #${data.maPhieuNhapThuoc} đã được tạo và cập nhật kho.`,
          type: 'success',
          createdAt: new Date(),
          read: false
        });
        fetchData();
        fetchAlertData();
        setRefreshTrigger(prev => prev + 1);
      } else if (topic === '/topic/kho-thuoc') {
        fetchData();
        fetchAlertData();
        setRefreshTrigger(prev => prev + 1);
      } else if (topic === '/topic/kho-alert') {
        const badgeMap = {
          'BÌNH_THƯỜNG': { label: 'Bình thường' },
          'SẮP_HẾT': { label: 'Sắp hết' },
          'CẢNH_BÁO': { label: 'Cảnh báo' },
          'HẾT_HÀNG': { label: 'Hết hàng' },
        };
        addBellNotification({
          id: Date.now() + Math.random(),
          title: `⚠️ Cảnh báo kho: ${badgeMap[data.trangThai]?.label || data.trangThai}`,
          message: `${data.tenThuoc || `#${data.maThuoc}`} - Tồn kho: ${data.soLuongTon}`,
          type: data.trangThai === 'HẾT_HÀNG' ? 'error' : data.trangThai === 'CẢNH_BÁO' ? 'warning' : 'info',
          createdAt: new Date(),
          read: false
        });
        fetchData();
        fetchAlertData();
      }
    }
  });

  const onRefresh = () => {
    setRefreshTrigger(t => t + 1);
    fetchData();
    fetchAlertData();
  };

  const navItems = [
    { id: 'inventory', label: 'Kho Thuốc', icon: 'inventory' },
    { id: 'history', label: 'Lịch Sử Nhập', icon: 'history' },
    { id: 'import', label: 'Nhập Thuốc', icon: 'add_shopping_cart' },
    { id: 'lichlamviec', label: 'Lịch Làm Việc', icon: 'calendar_month' },
  ];

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-body-md text-on-background overflow-hidden">
      {/* Sidebar */}
      <aside
        style={{ width: isSidebarOpen ? sidebarWidth : 80 }}
        className="relative bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm z-20"
      >
        {/* Handle kéo dãn sidebar */}
        {isSidebarOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              isResizing.current = true;
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              const onMouseMove = (ev) => {
                if (!isResizing.current) return;
                const newWidth = Math.min(Math.max(startWidth + (ev.clientX - startX), 200), 480);
                setSidebarWidth(newWidth);
              };
              const onMouseUp = () => {
                isResizing.current = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400/50 active:bg-cyan-500/60 transition-colors z-30"
            title="Kéo để thay đổi kích thước sidebar"
          />
        )}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-cyan-600/30">
              <span className="material-symbols-outlined text-[20px]">
                warehouse
              </span>
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl text-cyan-600 tracking-tight">
                MedCore
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-cyan-50 text-cyan-700 font-bold translate-x-1 border border-cyan-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {item.icon}
                  </span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Summary section in sidebar */}
        {isSidebarOpen && (
          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tồn kho:</span>
                <span className="font-bold text-cyan-600">
                  {inventory.filter(i => i.soLuongTon > 0).length}/{inventory.length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Hết hàng:</span>
                <span className="font-bold text-red-600">
                  {inventory.filter(i => !i.soLuongTon || i.soLuongTon <= 0).length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Phiếu nhập:</span>
                <span className="font-bold text-cyan-600">
                  {phieuNhapList.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {navItems.find((i) => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell
              notifications={bellNotifications}
              onMarkAsRead={markBellAsRead}
              onMarkAllAsRead={markAllBellAsRead}
              onClearAll={clearAllBell}
            />
            <UserMenu
              user={user}
              onLogout={onLogout}
              displayName={`Xin chào ${user?.username || ''}`}
              displayRole="Nhân viên kho"
              accentColor="cyan"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] scroll-smooth">
          {loading && <div className="flex justify-center py-10 text-gray-500"><span className="material-symbols-outlined animate-spin mr-2">refresh</span>Đang tải...</div>}

          {/* ─── TAB: Kho Thuốc ─── */}
          {!loading && activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Stats with alert indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tổng thuốc</p>
                  <p className="text-2xl font-bold text-gray-800">{allThuoc.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Bình thường</p>
                  <p className="text-2xl font-bold text-emerald-600">{alertStats.binhThuong}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">⚠️ Sắp hết / Cảnh báo</p>
                  <p className="text-2xl font-bold text-amber-600">{alertStats.sapHet + alertStats.canhBao}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">🚫 Hết hàng</p>
                  <p className="text-2xl font-bold text-red-600">{alertStats.hetHang}</p>
                </div>
              </div>

              {/* Reuse KhoThuocTab from admin components */}
              <KhoThuocTab thuocMap={thuocMap} />
            </div>
          )}

          {/* ─── TAB: Lịch Sử Nhập Thuốc ─── */}
          {!loading && activeTab === 'history' && (
            <LichSuNhapThuoc
              phieuNhapList={phieuNhapList}
              handleViewDetail={handleViewDetail}
              getTenThuoc={getTenThuoc}
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
            />
          )}

          {/* ─── TAB: Nhập Thuốc ─── */}
          {!loading && activeTab === 'import' && (
            <PhieuNhapTab
              nvMap={nvMap}
              thuocMap={thuocMap}
              thuocList={allThuoc}
              onRefresh={onRefresh}
              currentUser={user}
            />
          )}

          {activeTab === 'lichlamviec' && (
            <LichLamViecTab user={user} />
          )}
        </main>
      </div>

      {/* ─── MODAL CHI TIẾT PHIẾU NHẬP ─── */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Chi tiết phiếu nhập #{detailModal.maPhieuNhapThuoc}</h3>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-slate-400">{formatDateTime(detailModal.ngayNhap)}</span>
                  <span className="text-xs text-slate-500 font-bold">NCC: {suppliers.find(s => s.id === detailModal.maNhaCungCap)?.name || '—'}</span>
                </div>
              </div>
              <button onClick={() => setDetailModal(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400"><span className="material-symbols-outlined animate-spin mr-2">refresh</span>Đang tải...</div>
              ) : (
                <table className="w-full">
                  <thead><tr className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 text-left font-semibold">STT</th>
                    <th className="py-3 px-4 text-left font-semibold">Thuốc</th>
                    <th className="py-3 px-4 text-right font-semibold">SL</th>
                    <th className="py-3 px-4 text-right font-semibold">Đơn giá</th>
                    <th className="py-3 px-4 text-right font-semibold">Thành tiền</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {detailItems.map((item, i) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-sm text-slate-400">{i+1}</td>
                        <td className="py-3 px-4"><span className="font-bold text-sm text-slate-800">{getTenThuoc(item.maThuoc)}</span></td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-slate-700">{item.soLuongNhap}</td>
                        <td className="py-3 px-4 text-sm text-right text-slate-600">{formatCurrency(item.donGiaNhap)}</td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-cyan-700">{formatCurrency(item.thanhTien)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-slate-50">
                    <td colSpan="4" className="py-3 px-4 text-sm font-bold text-right text-slate-700">Tổng cộng:</td>
                    <td className="py-3 px-4 font-bold text-cyan-700 text-right">{formatCurrency(detailModal.tongTienNhap)}</td>
                  </tr></tfoot>
                </table>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setDetailModal(null)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BangDieuKhienKho;