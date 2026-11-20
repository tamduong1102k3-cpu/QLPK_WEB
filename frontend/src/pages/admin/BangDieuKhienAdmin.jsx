import * as statisticsApi from '../../api/statisticsApi';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour';
import { UsersThreeIcon } from '@phosphor-icons/react/dist/csr/UsersThree';
import { IdentificationBadgeIcon } from '@phosphor-icons/react/dist/csr/IdentificationBadge';
import { PillIcon } from '@phosphor-icons/react/dist/csr/Pill';
import { CalendarCheckIcon } from '@phosphor-icons/react/dist/csr/CalendarCheck';
import { HospitalIcon } from '@phosphor-icons/react/dist/csr/Hospital';
import { FirstAidKitIcon } from '@phosphor-icons/react/dist/csr/FirstAidKit';
import { ChartBarIcon } from '@phosphor-icons/react/dist/csr/ChartBar';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { StethoscopeIcon } from '@phosphor-icons/react/dist/csr/Stethoscope';
import { DatabaseIcon } from '@phosphor-icons/react/dist/csr/Database';
import UserMenu from '../../components/UserMenu';
import NotificationBell from '../../components/NotificationBell';
import { useNotification } from '../../components/NotificationContext';
import useWebSocket from '../../hooks/useWebSocket';
import { getKhoCanhBaoApi } from '../../api/khoThuocApi';
import fetchClient from '../../api/fetchClient';
import { getAccessToken, decodeTokenPayload } from '../../api/tokenStore';
import { API_BASE_URL } from '../../api/config';
import QuanLyNhanVien from './components/QuanLyNhanVien';
import QuanLyTaiKhoan from './components/QuanLyTaiKhoan';
import QuanLyNhaThuoc from './components/QuanLyNhaThuoc';
import QuanLyCaLamViec from './components/QuanLyCaLamViec';
import QuanLyThongKe from './components/QuanLyThongKe';
import QuanLyPhong from './components/QuanLyPhong';
import QuanLyDichVu from './components/QuanLyDichVu';
import QuanLyBenhNhan from './components/QuanLyBenhNhan';
import QuanLyChuyenKhoa from './components/QuanLyChuyenKhoa';

const MAX_BACKUP_FILE_SIZE = 100 * 1024 * 1024;

const getResponseErrorMessage = async (response, fallback) => {
  try {
    const body = await response.json();
    return body?.message || fallback;
  } catch {
    return fallback;
  }
};

const BangDieuKhienAdmin = ({
  onLogout,
  user
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [sidebarWidth, setSidebarWidth] = useState(256); // w-64 is 256px
  const isResizing = React.useRef(false);
  const [sapHet, setSapHet] = useState([]);
  const [sapHetLoading, setSapHetLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [cloudBackups, setCloudBackups] = useState([]);
  const [cloudBackupsLoading, setCloudBackupsLoading] = useState(false);
  const [cloudBackupAction, setCloudBackupAction] = useState(null);
  const [cloudBackupError, setCloudBackupError] = useState('');
  const restoreFileInputRef = useRef(null);
  const [summary, setSummary] = useState({
    tongBenhNhan: 0,
    lichKhamHomNay: 0,
    doanhThuThang: 0,
    luotKhamTuan: 0,
    topDichVu: []
  });

  const { bellNotifications, addBellNotification, markBellAsRead, markAllBellAsRead, clearAllBell, showConfirm, showSuccess, showError } = useNotification();
  const thongBaoLoadedRef = useRef(false);

  // Lấy maTaiKhoan admin từ JWT (claim maTaiKhoan cho NHAN_VIEN/QUAN_TRI_VIEN)
  const getMaTaiKhoanAdmin = () => {
    const payload = decodeTokenPayload(getAccessToken());
    return payload?.maTaiKhoan || null;
  };

  // Fetch thông báo persistent từ bảng thong_bao (do scheduler tạo)
  const fetchThongBaoAdmin = useCallback(async () => {
    const ma = getMaTaiKhoanAdmin();
    if (!ma) return;
    try {
      const res = await fetchClient(
        `${API_BASE_URL}/thong-bao/${ma}/QUAN_TRI_VIEN`,
        { skipLoading: true }
      );
      if (!res.ok) return;
      const result = await res.json();
      const list = result?.data ?? result ?? [];
      (Array.isArray(list) ? list : []).forEach(tb => {
        if (tb.id == null) return;
        addBellNotification({
          id: tb.id,
          title: tb.tieuDe || 'Thông báo',
          message: tb.noiDung || '',
          type: 'warning',
          createdAt: tb.createdAt ? new Date(tb.createdAt) : new Date(),
          read: tb.daDoc || false,
        });
      });
    } catch (e) { console.error('fetchThongBaoAdmin:', e); }
  }, [addBellNotification]);

  // Đánh dấu TẤT CẢ đã đọc: gọi BE mark-all-read rồi mới update local
  const handleMarkAllBellAsRead = useCallback(async () => {
    const ma = getMaTaiKhoanAdmin();
    if (ma) {
      try {
        await fetchClient(
          `${API_BASE_URL}/thong-bao/${ma}/QUAN_TRI_VIEN/mark-all-read`,
          { method: 'PUT', skipLoading: true }
        );
      } catch (e) { console.error('handleMarkAllBellAsRead:', e); }
    }
    markAllBellAsRead();
  }, [markAllBellAsRead]);

  // Lấy maTaiKhoan admin để subscribe topic thông báo riêng
  const [maTaiKhoanAdmin, setMaTaiKhoanAdmin] = useState(null);
  useEffect(() => {
    setMaTaiKhoanAdmin(getMaTaiKhoanAdmin());
  }, []);

  // (Bỏ bell synthetic: chuông admin đọc từ bảng thong_bao do scheduler tạo)

  // WebSocket subscription: topic kho chung (giữ bảng số liệu) + topic thong-bao riêng (persistent)
  const wsTopics = useRef(['/topic/kho-alert']).current;
  if (maTaiKhoanAdmin && !wsTopics.includes(`/topic/thong-bao/${maTaiKhoanAdmin}`)) {
    wsTopics.push(`/topic/thong-bao/${maTaiKhoanAdmin}`);
  }
  useWebSocket({
    topics: wsTopics,
    onMessage: (topic, data) => {
      // Thông báo persistent từ scheduler → id DB thật
      if (topic.startsWith('/topic/thong-bao/') && data) {
        if (data.id == null) return;
        addBellNotification({
          id: data.id,
          title: data.tieuDe || 'Thông báo',
          message: data.noiDung || '',
          type: 'warning',
          createdAt: new Date(),
          read: false,
        });
        return;
      }
      // Topic kho-alert: không tạo bell synthetic nữa (chuông đọc từ DB)
    },
  });

  useEffect(() => {
    // Fetch cảnh báo thuốc cho BẢNG dashboard (giữ nguyên), KHÔNG tạo bell synthetic
    getKhoCanhBaoApi().then(data => {
      setSapHet((data || []).filter(item => Number(item.soLuongTon) < 20));
      setSapHetLoading(false);
    }).catch(() => setSapHetLoading(false));

    // Fetch thông báo persistent từ DB cho chuông
    if (!thongBaoLoadedRef.current) {
      thongBaoLoadedRef.current = true;
      fetchThongBaoAdmin();
    }

    // Fetch dashboard summary
    statisticsApi.getDashboardSummaryApi().then(data => {
      if (data) {
        setSummary({
          tongBenhNhan: data.tongBenhNhan ?? 0,
          lichKhamHomNay: data.lichKhamHomNay ?? 0,
          doanhThuThang: data.doanhThuThang ?? 0,
          luotKhamTuan: data.luotKhamTuan ?? 0,
          topDichVu: data.topDichVu ?? []
        });
      }
    }).catch(err => console.error("Error fetching dashboard summary:", err));
  }, [fetchThongBaoAdmin]);

  const handleBackupDownload = async () => {
    if (backupLoading) return;

    setBackupLoading(true);

    try {
      const response = await fetchClient(`${API_BASE_URL}/admin/backup/export`, { skipLoading: true });
      if (!response.ok) {
        let errorMessage = 'Không thể tạo file backup. Vui lòng thử lại.';
        try {
          const errorBody = await response.json();
          errorMessage = errorBody?.message || errorMessage;
        } catch {
          // Use the default message when the server response is not JSON.
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('File backup tải về bị rỗng.');
      }

      const disposition = response.headers.get('Content-Disposition');
      const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .replace(/\.\d{3}Z$/, '');
      const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
        || `backup_${timestamp}.zip`;
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      showSuccess('Đã bắt đầu tải file backup.');
    } catch (error) {
      showError(error?.message || 'Không thể tải file backup. Vui lòng thử lại.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleBackupClick = () => {
    if (backupLoading) return;
    showConfirm(
      'File backup chứa toàn bộ dữ liệu phòng khám. Bạn có muốn tải file về thiết bị này không?',
      handleBackupDownload
    );
  };

  const handleRestoreFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && !file.name.toLowerCase().endsWith('.zip')) {
      event.target.value = '';
      setRestoreFile(null);
      showError('Chỉ chấp nhận file có định dạng .zip.');
      return;
    }
    if (file && file.size > MAX_BACKUP_FILE_SIZE) {
      event.target.value = '';
      setRestoreFile(null);
      showError('Dung lượng file backup không được vượt quá 100 MB.');
      return;
    }
    setRestoreFile(file);
  };

  const handleDatabaseRestore = async () => {
    if (!restoreFile || restoreLoading) return;

    setRestoreLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', restoreFile);
      const response = await fetchClient(`${API_BASE_URL}/admin/backup/restore`, {
        method: 'POST',
        body: formData,
        skipLoading: true,
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        // Use the fallback message if the server response is not JSON.
      }
      if (!response.ok) {
        throw new Error(result?.message || 'Không thể phục hồi database. Vui lòng kiểm tra file và thử lại.');
      }

      setRestoreFile(null);
      if (restoreFileInputRef.current) {
        restoreFileInputRef.current.value = '';
      }
      showSuccess(result?.message || 'Phục hồi database thành công.');
    } catch (error) {
      showError(error?.message || 'Không thể phục hồi database. Vui lòng thử lại.');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleRestoreClick = () => {
    if (!restoreFile || restoreLoading) return;
    showConfirm(
      'CẢNH BÁO: Hành động này sẽ xóa toàn bộ dữ liệu hiện tại và thay thế bằng dữ liệu trong file. Bạn có chắc chắn muốn tiếp tục?',
      handleDatabaseRestore
    );
  };

  const loadCloudBackups = useCallback(async () => {
    setCloudBackupsLoading(true);
    setCloudBackupError('');
    try {
      const response = await fetchClient(`${API_BASE_URL}/admin/backup/cloud`, { skipLoading: true });
      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, 'Không thể tải danh sách backup cloud.'));
      }

      const backups = await response.json();
      if (!Array.isArray(backups)) {
        throw new Error('Dữ liệu danh sách backup cloud không hợp lệ.');
      }
      setCloudBackups(backups);
      return true;
    } catch (error) {
      setCloudBackupError(error?.message || 'Không thể tải danh sách backup cloud.');
      return false;
    } finally {
      setCloudBackupsLoading(false);
    }
  }, []);

  const handleCloudBackup = async () => {
    if (cloudBackupAction) return;
    setCloudBackupAction('create');
    try {
      const response = await fetchClient(`${API_BASE_URL}/admin/backup/cloud`, {
        method: 'POST',
        skipLoading: true,
      });
      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, 'Không thể sao lưu lên cloud.'));
      }

      showSuccess('Đã tạo bản backup trên Backblaze B2.');
      await loadCloudBackups();
    } catch (error) {
      showError(error?.message || 'Không thể sao lưu lên cloud.');
    } finally {
      setCloudBackupAction(null);
    }
  };

  const handleCloudBackupDownload = async (backup) => {
    if (cloudBackupAction) return;
    setCloudBackupAction(`download:${backup.key}`);
    try {
      const response = await fetchClient(
        `${API_BASE_URL}/admin/backup/cloud/download?key=${encodeURIComponent(backup.key)}`,
        { skipLoading: true }
      );
      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, 'Không thể tải backup từ cloud.'));
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('File backup tải về bị rỗng.');
      }
      const disposition = response.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] || backup.filename;
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      showError(error?.message || 'Không thể tải backup từ cloud.');
    } finally {
      setCloudBackupAction(null);
    }
  };

  const handleCloudBackupRestore = (backup) => {
    showConfirm(
      `CẢNH BÁO: Phục hồi database từ bản backup cloud "${backup.filename}" sẽ thay thế dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?`,
      async () => {
        if (cloudBackupAction) return;
        setCloudBackupAction(`restore:${backup.key}`);
        try {
          const response = await fetchClient(`${API_BASE_URL}/admin/backup/cloud/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: backup.key }),
            skipLoading: true,
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result?.message || 'Không thể phục hồi backup từ cloud.');
          }

          showSuccess(result?.message || 'Phục hồi database thành công.');
          await loadCloudBackups();
        } catch (error) {
          showError(error?.message || 'Không thể phục hồi backup từ cloud.');
        } finally {
          setCloudBackupAction(null);
        }
      }
    );
  };

  const handleCloudBackupDelete = (backup) => {
    showConfirm(
      `Bạn có chắc chắn muốn xóa bản backup "${backup.filename}" khỏi Backblaze B2?`,
      async () => {
        if (cloudBackupAction) return;
        setCloudBackupAction(`delete:${backup.key}`);
        try {
          const response = await fetchClient(
            `${API_BASE_URL}/admin/backup/cloud?key=${encodeURIComponent(backup.key)}`,
            { method: 'DELETE', skipLoading: true }
          );
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result?.message || 'Không thể xóa backup trên cloud.');
          }

          showSuccess(result?.message || 'Đã xóa bản backup cloud.');
          await loadCloudBackups();
        } catch (error) {
          showError(error?.message || 'Không thể xóa backup trên cloud.');
        } finally {
          setCloudBackupAction(null);
        }
      }
    );
  };

  // Dữ liệu cho Dashboard
  const stats = [{
    title: 'Tổng Bệnh Nhân',
    value: summary.tongBenhNhan.toLocaleString(),
    icon: 'groups',
    color: 'bg-blue-500',
    trend: ''
  }, {
    title: 'Lịch Hẹn Hôm Nay',
    value: summary.lichKhamHomNay.toLocaleString(),
    icon: 'event',
    color: 'bg-green-500',
    trend: ''
  }, {
    title: 'Doanh Thu (Tháng)',
    value: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(summary.doanhThuThang),
    icon: 'payments',
    color: 'bg-orange-500',
    trend: ''
  }];
  const navItems = [{
    id: 'dashboard',
    label: 'Tổng Quan',
    icon: SquaresFourIcon,
    iconColor: '#2563eb'
  }, {
    id: 'patients',
    label: 'Bệnh Nhân',
    icon: UsersThreeIcon,
    iconColor: '#0d9488'
  }, {
    id: 'employees',
    label: 'Nhân Viên',
    icon: IdentificationBadgeIcon,
    iconColor: '#4f46e5'
  }, {
    id: 'pharmacy',
    label: 'Kho Thuốc',
    icon: PillIcon,
    iconColor: '#059669'
  }, {
    id: 'shifts',
    label: 'Ca Làm Việc',
    icon: CalendarCheckIcon,
    iconColor: '#d97706'
  }, {
    id: 'rooms',
    label: 'Phòng Chức Năng',
    icon: HospitalIcon,
    iconColor: '#2563eb'
  }, {
    id: 'services',
    label: 'Dịch Vụ',
    icon: FirstAidKitIcon,
    iconColor: '#0d9488'
  }, {
    id: 'statistics',
    label: 'Thống Kê',
    icon: ChartBarIcon,
    iconColor: '#4f46e5'
  }, {
    id: 'accounts',
    label: 'Tài Khoản',
    icon: ShieldCheckIcon,
    iconColor: '#2563eb'
  }, {
    id: 'specialties',
    label: 'Chuyên Khoa',
    icon: StethoscopeIcon,
    iconColor: '#e11d48'
  }, {
    id: 'backup',
    label: 'Sao Lưu',
    icon: DatabaseIcon,
    iconColor: '#059669'
  }];
  const activeNavItem = navItems.find(item => item.id === activeTab);
  const ActiveTabIcon = activeNavItem?.icon || SquaresFourIcon;
  return <div className="flex h-screen bg-[#f3f4f6] font-body-md text-on-background overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        style={{ width: isSidebarOpen ? sidebarWidth : 80 }}
        className="relative bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-20"
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
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400/50 active:bg-blue-500/60 transition-colors z-30"
            title="Kéo để thay đổi kích thước sidebar"
          />
        )}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            {isSidebarOpen && <span className="font-bold text-xl text-primary font-headline-md">MedCore</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map(item => <li key={item.id}>
                <button onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'backup') loadCloudBackups();
                }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-50/80 text-blue-700 font-semibold' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                  <item.icon
                    weight="duotone"
                    size={20}
                    color={item.iconColor}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              </li>)}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-900 focus:outline-none p-1 rounded-md hover:bg-gray-100">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-800 capitalize">
              {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
              <NotificationBell
              notifications={bellNotifications}
              onMarkAsRead={markBellAsRead}
              onMarkAllAsRead={handleMarkAllBellAsRead}
              onClearAll={clearAllBell}
            />
            <UserMenu
              user={user || { username: 'admin', email: 'admin@medcore.com', hoTen: 'Admin User' }}
              onLogout={onLogout}
              displayName={user?.username ? `Xin chào ${user.username}` : 'Admin User'}
              displayRole={user?.email || 'admin@medcore.com'}
              accentColor="primary"
            />
          </div>
        </header>

        {/* Dashboard Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
          
          {activeTab === 'dashboard' ? <div className="animate-fade-in space-y-6">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${stat.color}`}>
                      <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                      <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        <span className={`text-xs font-semibold mb-1 ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-gray-500'}`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  </div>)}
              </div>

                {/* Top Dịch Vụ & Luợt Khám Tuần */}
                <div className="space-y-6">
                    {/* Luợt khám tuần */}
                    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-md p-6 text-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-primary-container font-medium">Lượt Khám Tuần Này</span>
                        <span className="material-symbols-outlined opacity-50">analytics</span>
                      </div>
                      <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-bold">{summary.luotKhamTuan}</h3>
                        <span className="text-sm mb-1 opacity-80">lượt khám</span>
                      </div>
                      <p className="text-xs mt-4 opacity-70 italic">* Tính trong 7 ngày gần nhất bao gồm cả hôm nay</p>
                    </div>

                    {/* Top Dịch Vụ */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h2 className="text-lg font-bold text-gray-800 mb-4">Top Dịch Vụ Sử Dụng</h2>
                      <div className="space-y-4">
                        {summary.topDichVu.length === 0 ? <p className="text-sm text-gray-400 italic text-center py-4">Chưa có dữ liệu dịch vụ</p> : summary.topDichVu.map((item, idx) => {
                    let name = item[0];
                    let count = item[1];
                    const maxCount = summary.topDichVu[0][1];
                    const percent = count / maxCount * 100;
                    return <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700 font-medium truncate max-w-[200px]">{name}</span>
                                  <span className="text-gray-500 font-bold">{count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{
                          width: `${percent}%`
                        }}></div>
                                </div>
                              </div>;
                  })}
                      </div>
                    </div>
                </div>

              {/* ─n Thuốc Sắp Hết Widget (full width) ─────────────── */}
              <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-500 text-xl">medication_liquid</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">⚠ Thuốc Sắp Hết Trong Kho</h2>
                      <p className="text-xs text-gray-400">Dưới 20 đơn vị tồn kho</p>
                    </div>
                  </div>
                  {!sapHetLoading && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                      {sapHet.length} loại thuốc
                    </span>}
                </div>

                {sapHetLoading ? <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="text-sm">Đang tải...</span>
                  </div> : sapHet.length === 0 ? <div className="flex items-center justify-center py-8 gap-2 text-green-500">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="text-sm font-medium">Tất cả thuốc còn đủ hàng!</span>
                  </div> : <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="pb-2 font-medium">#</th>
                          <th className="pb-2 font-medium">Tên Thuốc</th>
                          <th className="pb-2 font-medium">Đơn Vị</th>
                          <th className="pb-2 font-medium text-center">Tồn Kho</th>
                          <th className="pb-2 font-medium">Hạn Sử Dụng</th>
                          <th className="pb-2 font-medium text-center">Mức Độ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sapHet.map((item, idx) => {
                    const sl = item.soLuongTon;
                    const level = sl === 0 ? 'Hết hàng' : sl <= 5 ? 'Nguy hiểm' : sl <= 10 ? 'Cảnh báo' : 'Thấp';
                    const levelStyle = sl === 0 ? 'bg-red-100 text-red-700' : sl <= 5 ? 'bg-red-50 text-red-600' : sl <= 10 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
                    const rowBg = sl === 0 ? 'bg-red-50/50' : sl <= 5 ? '' : '';
                    return <tr key={item.idKho} className={`border-b border-gray-100 last:border-0 hover:bg-orange-50/30 ${rowBg}`}>
                              <td className="py-2.5 text-xs text-gray-400">{idx + 1}</td>
                              <td className="py-2.5">
                                <span className="text-sm font-semibold text-gray-800">{item.tenThuoc}</span>
                              </td>
                              <td className="py-2.5 text-sm text-gray-500">{item.donViTinh || '—'}</td>
                              <td className="py-2.5 text-center">
                                <span className={`text-sm font-bold ${sl === 0 ? 'text-red-600' : sl <= 5 ? 'text-red-500' : sl <= 10 ? 'text-orange-500' : 'text-yellow-600'}`}>{sl}</span>
                              </td>
                              <td className="py-2.5 text-sm text-gray-500">
                                {item.hanSuDung ? new Date(item.hanSuDung).toLocaleDateString('vi-VN') : '—'}
                              </td>
                              <td className="py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${levelStyle}`}>
                                  {level}
                                </span>
                              </td>
                            </tr>;
                  })}
                      </tbody>
                    </table>
                  </div>}
              </div>
      </div> : activeTab === 'patients' ? <QuanLyBenhNhan title="Thông Tin Bệnh Nhân" /> : activeTab === 'employees' ? <QuanLyNhanVien /> : activeTab === 'accounts' ? <QuanLyTaiKhoan /> : activeTab === 'pharmacy' ? <QuanLyNhaThuoc /> : activeTab === 'shifts' ? <QuanLyCaLamViec /> : activeTab === 'statistics' ? <QuanLyThongKe /> : activeTab === 'rooms' ? <QuanLyPhong /> : activeTab === 'services' ? <QuanLyDichVu /> : activeTab === 'specialties' ? <QuanLyChuyenKhoa /> : activeTab === 'backup' ? (
          <div className="animate-fade-in mx-auto w-full max-w-6xl space-y-6">
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[32px] border-white/5" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-blue-400/10 blur-2xl" />
              <div className="relative z-10 w-full">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-100">
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  QUẢN TRỊ DỮ LIỆU
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Sao lưu &amp; phục hồi</h2>
                <p className="mt-2 w-full text-sm leading-6 text-blue-100/80 sm:text-base">
                  Tạo bản sao lưu ZIP hoặc phục hồi dữ liệu hệ thống từ một file backup đã có.
                </p>
              </div>
                <div className="pointer-events-none absolute right-0 top-0 hidden h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/10 sm:flex">
                  <span className="material-symbols-outlined text-5xl text-blue-100">database</span>
                </div>
            </section>

            <div className="grid items-stretch gap-6 lg:grid-cols-2">
              <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <span className="material-symbols-outlined text-2xl">cloud_download</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">01 · BACKUP</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-800">Tạo bản sao lưu</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">Xuất dữ liệu database thành file ZIP chứa file SQL.</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-1 items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <span className="material-symbols-outlined mt-0.5 text-lg text-blue-600">verified_user</span>
                  <p className="text-sm leading-6 text-slate-600">
                    File có thể chứa thông tin nhạy cảm của phòng khám. Hãy tải về thiết bị tin cậy và lưu trữ an toàn.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBackupClick}
                  disabled={backupLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className={`material-symbols-outlined ${backupLoading ? 'animate-spin' : ''}`}>
                    {backupLoading ? 'progress_activity' : 'download'}
                  </span>
                  {backupLoading ? 'Đang tạo file backup...' : 'Tải Backup Database (.zip)'}
                </button>
              </section>

              <section className="flex flex-col rounded-2xl border border-rose-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <span className="material-symbols-outlined text-2xl">restore</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-600">02 · RESTORE</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-800">Phục hồi dữ liệu</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">Nạp một file backup .zip (chứa file SQL) vào database hiện tại.</p>
                  </div>
                </div>

                <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <span className="material-symbols-outlined mt-0.5 text-lg text-rose-600">warning</span>
                  <p className="text-sm leading-6 text-rose-800">
                    Restore có thể làm gián đoạn ứng dụng hoặc để lại dữ liệu phục hồi dở dang. Hãy sao lưu dữ liệu hiện tại và dừng các thao tác ghi trước khi tiếp tục.
                  </p>
                </div>

                <input
                  ref={restoreFileInputRef}
                  id="database-restore-file"
                  type="file"
                  accept=".zip"
                  onChange={handleRestoreFileChange}
                  disabled={restoreLoading}
                  className="sr-only"
                />
                <label
                  htmlFor="database-restore-file"
                  className={`group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-6 text-center transition ${
                    restoreFile
                      ? 'border-emerald-300 bg-emerald-50/60 hover:border-emerald-400'
                      : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                  } ${restoreLoading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <span className={`material-symbols-outlined mb-2 text-3xl ${restoreFile ? 'text-emerald-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                    {restoreFile ? 'task' : 'upload_file'}
                  </span>
                  <span className="max-w-full break-all text-sm font-semibold text-slate-700">
                    {restoreFile ? restoreFile.name : 'Chọn file backup (.zip)'}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    {restoreFile
                      ? `${(restoreFile.size / (1024 * 1024)).toFixed(2)} MB · Nhấn để chọn file khác`
                      : 'Nhấn để duyệt file trên thiết bị'}
                  </span>
                </label>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Giới hạn mặc định: 100 MB</span>
                  {restoreFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreFile(null);
                        if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
                      }}
                      disabled={restoreLoading}
                      className="font-semibold text-slate-600 underline-offset-2 hover:text-rose-600 hover:underline disabled:opacity-50"
                    >
                      Bỏ chọn
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRestoreClick}
                  disabled={!restoreFile || restoreLoading}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                >
                  <span className={`material-symbols-outlined ${restoreLoading ? 'animate-spin' : ''}`}>
                    {restoreLoading ? 'progress_activity' : 'warning'}
                  </span>
                  {restoreLoading ? 'Đang phục hồi database...' : 'Bắt đầu phục hồi'}
                </button>
              </section>
            </div>

            <section className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <span className="material-symbols-outlined text-2xl">cloud</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      03 · CLOUD BACKUP (BACKBLAZE B2)
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-800">Sao lưu an toàn lên Cloud</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Lưu và quản lý các bản backup ZIP trên Backblaze B2.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={loadCloudBackups}
                    disabled={cloudBackupsLoading || cloudBackupAction !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className={`material-symbols-outlined text-lg ${cloudBackupsLoading ? 'animate-spin' : ''}`}>
                      {cloudBackupsLoading ? 'progress_activity' : 'refresh'}
                    </span>
                    Làm mới
                  </button>
                  <button
                    type="button"
                    onClick={handleCloudBackup}
                    disabled={cloudBackupsLoading || cloudBackupAction !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className={`material-symbols-outlined text-lg ${cloudBackupAction === 'create' ? 'animate-spin' : ''}`}>
                      {cloudBackupAction === 'create' ? 'progress_activity' : 'cloud_upload'}
                    </span>
                    Sao lưu lên Cloud ngay
                  </button>
                </div>
              </div>

              {cloudBackupError && (
                <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {cloudBackupError}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Tên file</th>
                      <th className="px-4 py-3 font-semibold">Thời gian tạo</th>
                      <th className="px-4 py-3 font-semibold">Dung lượng</th>
                      <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {cloudBackupsLoading && cloudBackups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          Đang tải danh sách backup cloud...
                        </td>
                      </tr>
                    ) : cloudBackups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          Chưa có bản backup trên cloud.
                        </td>
                      </tr>
                    ) : cloudBackups.map((backup) => (
                      <tr key={backup.key}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{backup.filename}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {backup.lastModified ? new Date(backup.lastModified).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {(Number(backup.size || 0) / (1024 * 1024)).toFixed(2)} MB
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleCloudBackupDownload(backup)}
                              disabled={cloudBackupAction !== null}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Tải về
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCloudBackupRestore(backup)}
                              disabled={cloudBackupAction !== null}
                              className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Phục hồi
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCloudBackupDelete(backup)}
                              disabled={cloudBackupAction !== null}
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) :
        // Placeholder for other tabs
        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
              <ActiveTabIcon
                size={64}
                weight="duotone"
                color={activeNavItem?.iconColor || '#2563eb'}
                className="mb-4 opacity-50"
                aria-hidden="true"
              />
              <h2 className="text-2xl font-bold text-gray-600 mb-2">Chức năng Đang phát triển</h2>
              <p>Màn hình quản lý {navItems.find(i => i.id === activeTab)?.label} sẽ được cập nhật sau.</p>
            </div>}

        </main>
      </div>
    </div>;
};
export default BangDieuKhienAdmin;
