import { getAllApi as _getAllAppointments, deleteApi } from '../../../api/appointmentApi';
import { API_BASE_URL } from '../../../api/config';
import { apiClient } from "../../../api/apiClient";
import React, { useState, useEffect } from 'react';
const API = `${API_BASE_URL}/appointments`;
const formatStatus = status => {
  switch (status) {
    case 'CHUA_DEN':
      return {
        label: 'Chưa đến',
        color: 'bg-yellow-100 text-yellow-700'
      };
    case 'DA_DEN':
      return {
        label: 'Đã đến',
        color: 'bg-green-100 text-green-700'
      };
    case 'HOAN':
      return {
        label: 'Đã hoàn thành',
        color: 'bg-blue-100 text-blue-700'
      };
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-700'
      };
  }
};

const QuanLyLichHen = ({ showActions = 'all', onQuickCheckIn }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await (async () => ({
        ok: true,
        json: async () => await _getAllAppointments()
      }))();
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAppointments();
  }, []);
  const handleUpdate = async e => {
    e.preventDefault();
    try {
      const res = await apiClient(`${API}/${editing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editing)
      });
      if (res.ok) {
        setEditing(null);
        fetchAppointments();
      }
    } catch (error) {
      alert("Lỗi khi cập nhật lịch hẹn");
    }
  };
  const handleDelete = async id => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch hẹn này?")) return;
    try {
      let res = {
        ok: false
      };
      try {
        await deleteApi(id);
        res.ok = true;
      } catch (e) {}
      if (res.ok) {
        fetchAppointments();
      }
    } catch (error) {
      alert("Lỗi khi xóa lịch hẹn");
    }
  };
  const filtered = appointments.filter(a => {
    // Không hiển thị lịch hẹn đã đến (DA_DEN) hoặc đã hoàn thành (HOAN)
    if (a.trangThai === 'DA_DEN' || a.trangThai === 'HOAN') return false;
    const matchesSearch = a.tenBenhNhan.toLowerCase().includes(search.toLowerCase()) || a.tenNhanVien.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || a.trangThai === filterStatus;
    return matchesSearch && matchesStatus;
  });
  return <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Quản Lý Lịch Hẹn</h2>
            <p className="text-sm text-gray-500">Xem danh sách lịch tái khám của bệnh nhân</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input type="text" placeholder="Tìm bệnh nhân, bác sĩ..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-64" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHUA_DEN">Chưa đến</option>
              <option value="DA_DEN">Đã đến</option>
              <option value="HOAN">Đã hoàn thành</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500 font-medium">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Bệnh Nhân</th>
                <th className="px-4 py-3">Chuyên Khoa</th>
                <th className="px-4 py-3">Bác Sĩ</th>
                <th className="px-4 py-3">Ca Khám</th>
                <th className="px-4 py-3">Ngày Hẹn</th>
                <th className="px-4 py-3">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="8" className="text-center py-10 text-gray-400 italic">Đang tải dữ liệu...</td></tr> : filtered.length === 0 ? <tr><td colSpan="8" className="text-center py-10 text-gray-400 italic">Không tìm thấy lịch hẹn nào</td></tr> : filtered.map(a => {
              const status = formatStatus(a.trangThai);
              return <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-400">#{a.id}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{a.tenBenhNhan}</div>
                      <div className="text-xs text-gray-400">BN{a.maBenhNhan}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{a.tenChuyenKhoa}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{a.tenNhanVien}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {a.tenCa || '—'}
                      {a.tenCa && <div className="text-xs text-gray-400">{a.gioBatDau} - {a.gioKetThuc}</div>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                      {new Date(a.ngayTaiKham).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      {showActions === 'checkin' ? (
                        <button onClick={() => onQuickCheckIn && onQuickCheckIn(a)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 font-semibold text-sm transform hover:scale-105 active:scale-95" title="Tiếp đón ngay">
                          <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                          <span>Tiếp đón</span>
                        </button>
                      ) : (
                        <>
                          <button onClick={() => setEditing(a)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Can thiệp">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa lịch">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && showActions !== 'checkin' && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-up overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Can Thiệp Lịch Hẹn #{editing.id}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Tái Khám</label>
                <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" value={editing.ngayTaiKham} onChange={e => setEditing({
              ...editing,
              ngayTaiKham: e.target.value
            })} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" value={editing.trangThai} onChange={e => setEditing({
              ...editing,
              trangThai: e.target.value
            })}>
                  <option value="CHUA_DEN">Chưa đến</option>
                  <option value="DA_DEN">Đã đến</option>
                  <option value="HOAN">Đã hoàn thành</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-24" value={editing.ghiChu || ''} onChange={e => setEditing({
              ...editing,
              ghiChu: e.target.value
            })}></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
export default QuanLyLichHen;