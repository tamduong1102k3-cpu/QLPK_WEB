import  { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../../api/config';
import {
  createBackupApi,
  getDatabaseInfoApi,
  listBackupsApi,
  restoreBackupApi
} from '../../../api/databaseApi';
import fetchClient from '../../../api/fetchClient';

const formatSize = (bytes) => {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN');
};

const QuanLyCaiDat = () => {
  const [dbInfo, setDbInfo] = useState(null);
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const loadData = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const [info, backupList] = await Promise.all([
        getDatabaseInfoApi(),
        listBackupsApi()
      ]);
      setDbInfo(info);
      setBackups(backupList || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể tải dữ liệu' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await createBackupApi();
      setMessage({ type: 'success', text: result.message || 'Tạo backup thành công!' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Tạo backup thất bại' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (filename) => {
    const confirmed = window.confirm(
      `Phục hồi database từ "${filename}"?\n\nToàn bộ dữ liệu hiện tại sẽ bị ghi đè.`
    );
    if (!confirmed) return;

    setIsRestoring(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await restoreBackupApi(filename);
      setMessage({ type: 'success', text: result.message || 'Phục hồi thành công!' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Phục hồi thất bại' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileRestore = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file .sql' });
      return;
    }
    // Upload file to server via restore API - using FormData
    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsRestoring(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await fetchClient(
        `${API_BASE_URL}/database/restore/upload`,
        { method: 'POST', body: formData, skipLoading: false }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload thất bại');
      setMessage({ type: 'success', text: data.message || 'Phục hồi thành công!' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Phục hồi thất bại' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {message.text && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600">database</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Thông Tin Database</h2>
            <p className="text-sm text-gray-500 mt-1">
              Fork service không khả dụng với free tier Aiven nên tính năng backup/restore qua cloud không hoạt động.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span>Đang tải thông tin...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Service</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{dbInfo?.serviceName || '—'}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Database</p>
              <p className="text-lg font-bold text-gray-800 mt-1 font-mono text-primary">{dbInfo?.databaseName || '—'}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Trạng thái</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{dbInfo?.state || '—'}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Host</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">Aiven MySQL</p>
            </div>
          </div>
        )}

      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-orange-500">upload_file</span>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Phục Hồi Từ File Upload</h3>
            <p className="text-sm text-gray-500">Tải lên file .sql từ máy tính</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="block w-full md:max-w-md text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
          />
          <button
            onClick={handleFileRestore}
            disabled={!selectedFile || isRestoring || isBackingUp}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">restore</span>
            {isRestoring ? 'Đang phục hồi...' : 'Phục hồi từ file'}
          </button>
        </div>
        <p className="text-xs text-red-500 mt-3 font-medium">
          Cảnh báo: Phục hồi sẽ ghi đè toàn bộ dữ liệu hiện tại.
        </p>
      </div>

      {backups.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-green-600">folder_open</span>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Danh Sách Bản Sao Lưu</h3>
              <p className="text-sm text-gray-500">{backups.length} bản sao lưu tự động từ cloud</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-3 font-medium">Tên file</th>
                  <th className="pb-3 font-medium">Kích thước</th>
                  <th className="pb-3 font-medium">Thời gian</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((item, index) => {
                  const filename = item.backup_id || item.backup_location || `Backup ${index + 1}`;
                  const rowKey = item.backup_id || `backup-${index}`;
                  return (
                    <tr key={rowKey} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                      <td className="py-3 pr-4">
                        <span className="text-sm font-semibold text-gray-800">{filename}</span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{formatSize(item.data_size || item.size)}</td>
                      <td className="py-3 text-sm text-gray-600">{formatDate(item.start_time || item.createdAt)}</td>
                      <td className="py-3">
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">Cloud Aiven</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 italic">Đây là bản sao lưu tự động từ Aiven cloud, không thể phục hồi qua JDBC.</p>
        </div>
      )}
    </div>
  );
};

export default QuanLyCaiDat;