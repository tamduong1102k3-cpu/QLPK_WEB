import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../../../api/config';
import fetchClient from '../../../api/fetchClient';

const QuanLyCauHinh = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => {
      setStatus({ type: '', message: '' });
    }, 6000);
  };

  const handleBackup = async () => {
    setLoading(true);
    showStatus('info', 'Đang kết nối cơ sở dữ liệu và chuẩn bị tệp sao lưu...');
    try {
      const response = await fetchClient(`${API_BASE_URL}/backup/export`);
      if (!response.ok) {
        throw new Error('Lỗi từ hệ thống khi tạo tệp sao lưu.');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `backup_medcore_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.sql`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) fileName = match[1];
      }

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showStatus('success', `Tải về tệp sao lưu thành công: ${fileName}`);
    } catch (error) {
      console.error(error);
      showStatus('error', 'Có lỗi xảy ra trong quá trình sao lưu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        showStatus('error', 'Vui lòng chọn tệp tin có định dạng .sql');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      showStatus('info', `Đã chọn tệp tin: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    }
  };

  const triggerRestore = () => {
    if (!selectedFile) {
      showStatus('error', 'Vui lòng chọn tệp tin backup (.sql) trước khi khôi phục.');
      return;
    }
    setShowConfirm(true);
  };

  const handleRestore = async () => {
    setShowConfirm(false);
    setLoading(true);
    showStatus('info', 'Đang đọc tệp và khôi phục cơ sở dữ liệu. Vui lòng không đóng trình duyệt...');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetchClient(`${API_BASE_URL}/backup/import`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.success) {
        showStatus('success', 'Khôi phục cơ sở dữ liệu thành công! Hệ thống đã quay về trạng thái cũ.');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        throw new Error(result.message || 'Lỗi khôi phục cơ sở dữ liệu.');
      }
    } catch (error) {
      console.error(error);
      showStatus('error', 'Có lỗi xảy ra trong quá trình khôi phục: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header card with gradient */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <span className="material-symbols-outlined text-[180px]">settings</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined">settings_suggest</span>
          Cài Đặt Hệ Thống
        </h2>
        <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
          Quản lý cơ sở dữ liệu, sao lưu và khôi phục dữ liệu phòng khám MedCore. Đảm bảo dữ liệu của bạn luôn an toàn.
        </p>
      </div>

      {/* Alert Status message */}
      {status.message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border transition-all ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          status.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <span className="material-symbols-outlined mt-0.5">
            {status.type === 'success' ? 'check_circle' :
             status.type === 'error' ? 'error' : 'info'}
          </span>
          <div className="text-sm font-medium">{status.message}</div>
        </div>
      )}

      {/* Main Grid for Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Backup Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">cloud_download</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Sao Lưu Dữ Liệu (Backup)</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Xuất toàn bộ cấu trúc bảng và dữ liệu hiện tại trong cơ sở dữ liệu thành tệp tin định dạng `.sql`. Bạn có thể dùng tệp tin này để lưu trữ an toàn hoặc khôi phục lại sau này.
            </p>
          </div>
          <button
            onClick={handleBackup}
            disabled={loading}
            className={`w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading && status.type === 'info' && status.message.includes('sao lưu') ? (
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined">database</span>
            )}
            Tạo Bản Sao Lưu (.sql)
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">history</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Khôi Phục Dữ Liệu (Restore)</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Chọn một bản sao lưu (.sql) từ máy tính để ghi đè dữ liệu phòng khám hiện tại. 
            </p>
            
            {/* Warning Message inside Restore */}
            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 mb-6 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-red-600 text-[18px] mt-0.5">warning</span>
              <span className="text-[12px] text-red-700 leading-normal">
                <strong>Cảnh báo nguy hiểm:</strong> Hành động này sẽ xóa toàn bộ dữ liệu hiện có và thay thế bằng dữ liệu từ tệp khôi phục. Vui lòng cân nhắc kỹ trước khi thực hiện.
              </span>
            </div>

            {/* Custom File Upload Input */}
            <div className="mb-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".sql"
                className="hidden"
                id="restore-file-input"
                disabled={loading}
              />
              <label
                htmlFor="restore-file-input"
                className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors bg-gray-50/50 ${
                  loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                <span className="material-symbols-outlined text-gray-400 text-3xl mb-1">upload_file</span>
                <span className="text-sm font-semibold text-gray-600">
                  {selectedFile ? selectedFile.name : 'Chọn tệp sao lưu (.sql)'}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Nhấp để duyệt tệp'}
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={triggerRestore}
            disabled={loading || !selectedFile}
            className={`w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm ${
              loading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading && status.type === 'info' && status.message.includes('khôi phục') ? (
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined">settings_backup_restore</span>
            )}
            Khôi Phục Ngay
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h4 className="text-lg font-bold">Xác nhận khôi phục dữ liệu?</h4>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Bạn đang chuẩn bị khôi phục cơ sở dữ liệu từ tệp <strong>{selectedFile?.name}</strong>. Hành động này sẽ <strong>xóa và thay thế toàn bộ dữ liệu hiện tại</strong> của MedCore và không thể hoàn tác.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRestore}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Đồng ý, Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyCauHinh;
