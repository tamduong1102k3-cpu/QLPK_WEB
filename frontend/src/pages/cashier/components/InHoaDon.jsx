import React from 'react';

const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const InHoaDon = ({ invoice, patient, invoiceDetails, className = '' }) => {
  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=750,height=700');
    if (!w) return;

    const d = new Date();
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const rows = (invoiceDetails || []).map(i => `<tr>
      <td class="c">${i.noiDung || '—'}</td>
      <td class="r">${i.soLuong || 0}</td>
      <td class="r">${formatCurrency(i.donGia)}</td>
      <td class="r b">${formatCurrency(i.thanhTien)}</td>
    </tr>`).join('');

    w.document.write(`<!DOCTYPE html><html>
<head><meta charset="UTF-8"><title>Hóa đơn #${invoice?.maHoaDon || ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Helvetica Neue',Arial,sans-serif;background:#f0f2f5;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:30px}
.paper{width:680px;background:#fff;padding:48px 44px 36px;box-shadow:0 2px 20px rgba(0,0,0,.07);position:relative}
.paper:before{content:'';position:absolute;top:0;left:44px;right:44px;height:3px;background:linear-gradient(90deg,#059669,#34d399);border-radius:0 0 3px 3px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
.titles h1{font-size:20px;font-weight:800;color:#059669;letter-spacing:-.3px}
.titles p{font-size:11px;color:#94a3b8;margin-top:2px;letter-spacing:.4px;font-weight:500}
.label{background:#f0fdf4;color:#059669;font-size:10px;font-weight:800;padding:5px 14px;border-radius:20px;border:1px solid #bbf7d0;letter-spacing:.5px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:28px;border:1px solid #f1f5f9}
.grid-i{text-align:center}
.grid-i .l{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px}
.grid-i .v{font-size:14px;font-weight:700;color:#0f172a;margin-top:3px}
.pat{font-size:13px;font-weight:600;color:#0f172a;margin-bottom:18px;padding:0 2px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
th{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;padding:8px 10px;border-bottom:1.5px solid #e2e8f0;text-align:left}
th.r{text-align:right}
td{padding:9px 10px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9}
td.r{text-align:right}
td.b{font-weight:600}
td.c{color:#334155}
.totals{display:flex;justify-content:flex-end;margin-top:20px;padding-top:14px;border-top:1.5px solid #e2e8f0}
.tl{width:240px}
.tr{display:flex;justify-content:space-between;padding:3px 0;font-size:13px;color:#64748b}
.tr.g{font-size:17px;font-weight:600;color:#059669;padding-top:10px;margin-top:8px;border-top:1.5px solid #059669}
.foot{text-align:center;margin-top:32px;padding-top:20px;border-top:1px dashed #e2e8f0;color:#94a3b8;font-size:11px;letter-spacing:.3px}
@media print{body{background:#fff;padding:0}.paper{box-shadow:none;padding:40px}}
</style></head>
<body><div class="paper">
<div class="header">
<div class="titles"><h1>PHÒNG KHÁM MEDCORE</h1><p>Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM</p></div>
<span class="label">HÓA ĐƠN THANH TOÁN</span>
</div>
<div class="grid">
<div class="grid-i"><div class="l">Số hóa đơn</div><div class="v">#${invoice?.maHoaDon?.toString().padStart(4, '0') || '—'}</div></div>
<div class="grid-i"><div class="l">Ngày</div><div class="v">${date}</div></div>
<div class="grid-i"><div class="l">Giờ</div><div class="v">${time}</div></div>
<div class="grid-i"><div class="l">Mã phiếu khám</div><div class="v">#${invoice?.maPhieuKham?.toString().padStart(4, '0') || '—'}</div></div>
</div>
<div class="pat">👤 Bệnh nhân: <strong>${patient?.hoTen || '—'}</strong></div>
<table><thead><tr><th style="width:44%">Nội dung</th><th class="r" style="width:12%">Số lượng</th><th class="r" style="width:22%">Đơn giá</th><th class="r" style="width:22%">Thành tiền</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="totals"><div class="tl"><div class="tr g"><span>TỔNG CỘNG</span><span>${formatCurrency(invoice?.tongTien)}</span></div></div></div>
<div class="foot">📞 Hotline: 1900 1234 &nbsp;|&nbsp; ✉ Email: info@medcore.vn<br>Cảm ơn quý khách!</div>
</div>
<script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  };

  return (
    <button
      onClick={handlePrint}
      className={`px-5 py-3.5 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-50 shadow-sm border border-slate-200 transition-all flex items-center gap-2 ${className}`}
    >
      <span className="material-symbols-outlined">print</span>
      In
    </button>
  );
};

export default InHoaDon;
