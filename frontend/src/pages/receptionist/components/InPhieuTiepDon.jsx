import React from 'react';

const InPhieuTiepDon = ({ printData, className = '' }) => {
  const handlePrint = () => {
    if (!printData) return;
    const w = window.open('', '_blank', 'width=450,height=600');
    if (!w) {
      alert("Không thể mở cửa sổ in. Vui lòng cho phép popup trên trình duyệt.");
      return;
    }

    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Phiếu tiếp đón #${printData.soThuTu}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .ticket-container {
      width: 380px;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
      padding: 32px 28px;
    }
    
    /* Top Accent Line */
    .ticket-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #005bbf, #4f46e5);
    }
    
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    
    .logo {
      font-size: 13px;
      font-weight: 800;
      color: #005bbf;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .subtitle {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .title {
      font-size: 18px;
      font-weight: 800;
      color: #1e293b;
      margin-top: 12px;
      letter-spacing: -0.5px;
    }
    
    .divider {
      height: 1px;
      border-top: 1.5px dashed #cbd5e1;
      margin: 20px 0;
    }
    
    .number-box {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .number-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .number-val {
      font-size: 64px;
      font-weight: 900;
      color: #005bbf;
      line-height: 1;
      margin-top: 6px;
      letter-spacing: -1px;
    }
    
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 13px;
    }
    
    .info-label {
      color: #64748b;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    
    .info-value {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
      max-width: 65%;
      word-break: break-word;
    }
    
    .info-value.highlight {
      color: #4f46e5;
    }
    
    .info-value.price {
      color: #059669;
    }
    
    .barcode-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
    
    .barcode {
      display: flex;
      height: 38px;
      align-items: stretch;
      margin-bottom: 6px;
    }
    
    .barcode span {
      background: #0f172a;
      margin-right: 2px;
    }
    
    .barcode .w-1 { width: 1px; }
    .barcode .w-2 { width: 2.5px; }
    .barcode .w-3 { width: 4px; }
    
    .barcode-code {
      font-family: monospace;
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      line-height: 1.5;
    }
    
    @media print {
      body {
        background: #ffffff;
        padding: 0;
        display: block;
        min-height: auto;
      }
      .ticket-container {
        border: none;
        box-shadow: none;
        width: 100%;
        padding: 10px 5px;
      }
      .ticket-container::before {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="header">
      <div class="logo">MedCore Clinic</div>
      <div class="subtitle">Hệ thống Y tế Quốc tế</div>
      <div class="title">PHIẾU TIẾP ĐÓN</div>
    </div>
    
    <div class="number-box">
      <div class="number-label">Số thứ tự khám</div>
      <div class="number-val">#${printData.soThuTu}</div>
      ${printData.tenPhong ? `<div class="number-room" style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #4f46e5;">${printData.tenPhong}</div>` : ''}
    </div>
    
    <div class="info-list">
      <div class="info-item">
        <span class="info-label">Bệnh nhân</span>
        <span class="info-value">${printData.benhNhan?.hoTen || '—'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Mã BN</span>
        <span class="info-value">#${printData.benhNhan?.maBenhNhan || '—'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Chuyên khoa</span>
        <span class="info-value highlight">${printData.chuyenKhoa?.tenChuyenKhoa || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Dịch vụ</span>
        <span class="info-value">${printData.dichVu?.tenDichVu || 'Không có'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Đơn giá</span>
        <span class="info-value price">${printData.dichVu ? `${new Intl.NumberFormat('vi-VN').format(printData.dichVu.donGia)}đ` : 'N/A'}</span>
      </div>
      ${printData.bacSi ? `
      <div class="info-item">
        <span class="info-label">Bác sĩ khám</span>
        <span class="info-value">${printData.bacSi.hoTen}</span>
      </div>` : ''}
      <div class="info-item">
        <span class="info-label">Thời gian</span>
        <span class="info-value">${printData.ngayDangKy}</span>
      </div>
      ${printData.ghiChu ? `
      <div class="divider"></div>
      <div class="info-item" style="flex-direction: column; align-items: flex-start; gap: 4px;">
        <span class="info-label">Triệu chứng / Ghi chú</span>
        <span class="info-value" style="text-align: left; max-width: 100%; font-weight: 500; color: #334155;">${printData.ghiChu}</span>
      </div>` : ''}
    </div>
    
    <div class="barcode-section">
      <div class="barcode">
        <span class="w-1"></span><span class="w-2"></span><span class="w-1"></span><span class="w-3"></span>
        <span class="w-1"></span><span class="w-1"></span><span class="w-2"></span><span class="w-1"></span>
        <span class="w-3"></span><span class="w-1"></span><span class="w-1"></span><span class="w-2"></span>
        <span class="w-1"></span><span class="w-3"></span><span class="w-1"></span><span class="w-1"></span>
        <span class="w-2"></span><span class="w-1"></span><span class="w-3"></span><span class="w-1"></span>
      </div>
      <div class="barcode-code">MC-${printData.benhNhan?.maBenhNhan || '0000'}</div>
    </div>
    
    <div class="footer">
      Vui lòng theo dõi bảng điện tử<br>và nghe loa gọi số khi đến lượt khám.<br>
      Xin cảm ơn!
    </div>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <button
      onClick={handlePrint}
      className={`flex items-center justify-center gap-2 font-black ${className}`}
    >
      <span className="material-symbols-outlined">print</span>
      In phiếu
    </button>
  );
};

export default InPhieuTiepDon;
