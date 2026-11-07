import React from 'react';

const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const InDonThuoc = ({ patient, prescriptions, formatDateTime }) => {
  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=860,height=700');
    if (!w) return;

    const now = new Date();
    const date = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Build prescription sections
    const toaHtml = (prescriptions || []).map((toa, idx) => {
      const rows = (toa.chiTietThuoc || []).map((item, i) => `<tr>
        <td class="c" style="width:4%">${i + 1}</td>
        <td style="width:20%"><strong>${item.tenThuoc || '—'}</strong>${item.hoatChat ? `<br><span class="sm">${item.hoatChat}</span>` : ''}</td>
        <td><strong>${item.hamLuong || '—'}</strong></td>
        <td>${item.donViTinh || '—'}</td>
        <td>${item.lieuDung || '—'}</td>
        <td class="r">${item.sang || '—'}</td>
        <td class="r">${item.trua || '—'}</td>
        <td class="r">${item.chieu || '—'}</td>
        <td class="r">${item.toi || '—'}</td>
        <td class="r">${item.soNgay || '—'}</td>
        <td>${item.cachDung || '—'}</td>
        <td>${item.thoiDiemDung || '—'}</td>
      </tr>`).join('');

      let statusLabel = '⏳ Chờ cấp thuốc';
      let statusClass = 'pending';
      if (toa.trangThai === 'DA_CAP_THUOC') {
        statusLabel = '✓ Đã cấp thuốc';
        statusClass = 'done';
      } else if (toa.trangThai === 'HET_HAN_NHAN_THUOC') {
        statusLabel = '✖ Hết hạn nhận thuốc';
        statusClass = 'expired';
      }

      return `
        <div class="toa-section">
          <div class="toa-header">
            <h3>Toa thuốc #${toa.maToaThuoc}</h3>
            <span class="status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="toa-meta">Ngày tạo: ${formatDate(toa.ngayTao)} ${formatTime(toa.ngayTao)}${toa.ghiChu ? ` &nbsp;|&nbsp; Ghi chú: ${toa.ghiChu}` : ''}</div>
          <table>
            <thead><tr>
              <th class="c">STT</th><th>Tên thuốc</th><th>Hàm lượng</th><th>ĐVT</th><th>Liều dùng</th>
              <th class="r">Sáng</th><th class="r">Trưa</th><th class="r">Chiều</th><th class="r">Tối</th>
              <th class="r">Số ngày</th><th>Cách dùng</th><th>Thời điểm</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }).join('');

    w.document.write(`<!DOCTYPE html><html>
<head><meta charset="UTF-8"><title>Đơn thuốc - ${patient?.hoTen || ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Helvetica Neue',Arial,sans-serif;background:#f0f2f5;display:flex;justify-content:center;min-height:100vh;padding:30px}
.paper{width:900px;background:#fff;padding:44px 40px 36px;box-shadow:0 2px 15px rgba(0,0,0,.06)}
.paper:before{content:'';display:block;height:3px;background:linear-gradient(90deg,#d97706,#fbbf24);border-radius:0 0 3px 3px;margin-bottom:28px}
.header{text-align:center;margin-bottom:24px}
.header h1{font-size:20px;font-weight:700;color:#d97706;letter-spacing:-.3px}
.header p{font-size:11px;color:#94a3b8;margin-top:2px}
.tt{font-size:15px;font-weight:700;color:#92400e;letter-spacing:.5px}
.pat-info{background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:20px;border:1px solid #f1f5f9;font-size:12px}
.pat-info .row{display:flex;flex-wrap:wrap;gap:6px 20px;color:#334155}
.pat-info .row strong{color:#0f172a}
.toa-section{border:1px solid #e2e8f0;border-radius:10px;margin-bottom:18px;overflow:hidden}
.toa-header{display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:10px 14px;border-bottom:1px solid #e2e8f0}
.toa-header h3{font-size:13px;font-weight:700;color:#0f172a}
.toa-header .status{font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px}
.toa-header .status.done{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.toa-header .status.pending{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
.toa-header .status.expired{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0}
.toa-meta{font-size:10px;color:#94a3b8;padding:6px 14px;border-bottom:1px solid #f1f5f9}
table{width:100%;border-collapse:collapse;font-size:11.5px}
th{font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;padding:7px 5px;border-bottom:1.5px solid #e2e8f0;text-align:left}
th.c{text-align:center}
th.r{text-align:center}
td{padding:7px 5px;color:#1e293b;border-bottom:1px solid #f1f5f9}
td.c{text-align:center}
td.r{text-align:center}
td strong{color:#0f172a;font-weight:700}
td .sm{font-size:9.5px;color:#94a3b8}
.foot{text-align:center;margin-top:20px;padding-top:14px;border-top:1px dashed #e2e8f0;color:#94a3b8;font-size:10.5px}
@media print{body{background:#fff;padding:0}.paper{box-shadow:none;padding:36px}}
</style></head>
<body><div class="paper">
<div class="header">
<h1>PHÒNG KHÁM MEDCORE</h1>
<p>Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM &nbsp;|&nbsp; 📞 1900 1234</p>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 18px;margin-bottom:20px">
<span class="tt">ĐƠN THUỐC</span>
<span style="font-size:10px;font-weight:700;color:#d97706;background:#fff;padding:3px 12px;border-radius:20px;border:1px solid #fde68a">Ngày: ${date} - ${time}</span>
</div>
<div class="pat-info">
<div class="row">
<span>Họ tên: <strong>${patient?.hoTen || '—'}</strong></span>
<span>Mã BN: <strong>#${patient?.maBenhNhan || '—'}</strong></span>
<span>Mã PK: <strong>#${patient?.maPhieuKham || '—'}</strong></span>
<span>Mã HĐ: <strong>#${patient?.maHoaDon || '—'}</strong></span>
<span>SĐT: <strong>${patient?.soDienThoai || 'N/A'}</strong></span>
</div>
</div>
${toaHtml}
<div class="foot">📞 Hotline: 1900 1234 &nbsp;|&nbsp; ✉ Email: info@medcore.vn</div>
</div>
<script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  };

  if (!prescriptions || prescriptions.length === 0) return null;

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 shadow-sm border border-amber-200 transition-all text-xs"
    >
      <span className="material-symbols-outlined text-[16px]">print</span>
      In đơn thuốc
    </button>
  );
};

export default InDonThuoc;