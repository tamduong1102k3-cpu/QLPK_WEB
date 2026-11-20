import React, { useState, useEffect } from 'react';
import { getAvailableClsResultsApi } from '../api/phieuKhamApi';
import Modal from './Modal';

const fmt = (v) => v ?? '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const Section = ({ title, children, cols = 1, highlight }) => (
  <div style={{
    background: highlight ? '#f0fdf4' : '#f9fafb',
    borderRadius: '10px',
    padding: '14px 18px',
    border: highlight ? '1px solid #bbf7d0' : 'none'
  }}>
    {title && (
      <p style={{
        margin: '0 0 10px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: highlight ? '#15803d' : '#6b7280'
      }}>{title}</p>
    )}
    {cols > 1 ? (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px' }}>
        {children}
      </div>
    ) : children}
  </div>
);

const Field = ({ label, value, large }) => (
  <div>
    {label && (
      <p style={{
        margin: '0 0 2px',
        fontSize: '11px',
        color: '#9ca3af',
        fontWeight: 600
      }}>{label}</p>
    )}
    <p style={{
      margin: 0,
      fontSize: large ? '15px' : '13px',
      fontWeight: 500,
      color: '#1f2937',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}>{fmt(value)}</p>
  </div>
);

// ── MODAL PHIẾU CẬN LÂM SÀNG ──
const ClsModal = ({ maPhieuKham, onClose }) => {
  const [clsData, setClsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCls = async () => {
      try {
        const data = await getAvailableClsResultsApi(maPhieuKham);
        setClsData(data || []);
      } catch {
        setClsData([]);
      } finally {
        setLoading(false);
      }
    };
    if (maPhieuKham) fetchCls();
  }, [maPhieuKham]);

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="700px" zIndex={10000} contentPadding="0">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46, #10b981)',
        padding: '18px 22px', borderRadius: '12px 12px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            Phiếu Cận Lâm Sàng — PK{String(maPhieuKham).padStart(4, '0')}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
            Danh sách dịch vụ cận lâm sàng
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
          color: '#fff', width: '34px', height: '34px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
           onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 22px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Đang tải...</div>
        ) : clsData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>science</span>
            Không có dịch vụ cận lâm sàng nào
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clsData.map((item, idx) => (
              <div key={idx} style={{
                background: '#f9fafb', borderRadius: '8px', padding: '14px 16px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
                      {item.tenDichVu || item.tenCLS || `Dịch vụ #${idx + 1}`}
                    </p>
                    {item.maDichVu && (
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280' }}>
                        Mã: {item.maDichVu}
                      </p>
                    )}
                  </div>
                  <span style={{
                    padding: '2px 10px', borderRadius: '12px',
                    fontSize: '11px', fontWeight: 600,
                    background: item.trangThai === 'HOAN_THANH' ? '#dcfce7' :
                                item.trangThai === 'DANG_THUC_HIEN' ? '#dbeafe' : '#fef3c7',
                    color: item.trangThai === 'HOAN_THANH' ? '#166534' :
                           item.trangThai === 'DANG_THUC_HIEN' ? '#1d4ed8' : '#92400e'
                  }}>
                    {item.trangThai === 'HOAN_THANH' ? 'Hoàn thành' :
                     item.trangThai === 'DANG_THUC_HIEN' ? 'Đang thực hiện' : 'Chờ thực hiện'}
                  </span>
                </div>
                {item.ketQua && (
                  <div style={{
                    marginTop: '8px', padding: '10px 12px',
                    background: '#f0fdf4', borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                      Kết quả
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#166534', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {item.ketQua}
                    </p>
                  </div>
                )}
                {item.ketLuan && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                    Kết luận: {item.ketLuan}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

// ── MODAL CHI TIẾT KHÁM CHÍNH ──
export const ModalContent = ({ data, onClose }) => {
  const [showCls, setShowCls] = useState(false);
  if (!data) return null;
  return (
    <>
      <Modal isOpen={true} onClose={onClose} maxWidth="860px" zIndex={9999} contentPadding="0">
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          padding: '20px 26px',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
              Phiếu Khám PK{String(data.maPhieuKham).padStart(4, '0')}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              {fmtDateTime(data.ngayKham)} — {data.tenChuyenKhoa} {data.tenDichVu ? ` — ${data.tenDichVu}` : ''} — BS. {data.tenNhanVien}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
              color: '#fff', width: '34px', height: '34px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            ✕
          </button>
        </div>

        {/* BODY - 2 cột grid */}
        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Hàng 1: Lý do khám + Khám lâm sàng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Section title="Lý do khám">
              <Field value={data.lyDoKham} large />
            </Section>
            <Section title="Khám lâm sàng">
              <Field value={data.khamLamSang} large />
            </Section>
          </div>

          {/* Hàng 2: Tiền sử bản thân + Bệnh sử */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Section title="Tiền sử bản thân">
              <Field value={data.tienSuBanThan} large />
            </Section>
            <Section title="Bệnh sử">
              <Field value={data.benhSu} large />
            </Section>
          </div>

          {/* Hàng 3: Cận lâm sàng full width */}
          <Section title="Cận lâm sàng">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Field value={data.ketQuaCLS} large />
              </div>
              {data.maPhieuKham && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCls(true); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '8px 16px', background: '#059669', color: '#fff',
                    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    transition: 'all .15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                  onMouseLeave={e => e.currentTarget.style.background = '#059669'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>science</span>
                  Xem phiếu CLS
                </button>
              )}
            </div>
          </Section>

          {/* Hàng 4: Chẩn đoán + Kết quả */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Section title="Chẩn đoán sơ bộ" highlight>
              <Field value={data.chanDoanSoBo} large />
            </Section>
            <Section title="Kết quả cận lâm sàng" highlight>
              <Field value={data.ketQuaCLS} large />
            </Section>
          </div>

          {/* Hàng 5: Lời dặn full width */}
          <Section title="Lời dặn bác sĩ" highlight>
            <Field value={data.loiDanBacSi} large />
          </Section>

          {/* Hàng 6: Ghi chú */}
          {data.ghiChuKham && (
            <Section title="Ghi chú chung">
              <Field value={data.ghiChuKham} large />
            </Section>
          )}

        </div>
      </Modal>

      {/* Sub-modal phiếu CLS */}
      {showCls && (
        <ClsModal maPhieuKham={data.maPhieuKham} onClose={() => setShowCls(false)} />
      )}
    </>
  );
};

const ChiTietKhamModal = ({ data, buttonStyle, buttonLabel = 'Xem chi tiết', buttonIcon = 'visibility', allowViewDetail = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Nếu không được phép xem chi tiết thì không render gì
  if (!allowViewDetail) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', background: '#eff6ff', color: '#2563eb',
          border: '1px solid #bfdbfe', borderRadius: '6px',
          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all .15s',
          ...buttonStyle
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
      >
        {buttonIcon && (
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{buttonIcon}</span>
        )}
        {buttonLabel}
      </button>

      {isOpen && (
        <ModalContent data={data} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default ChiTietKhamModal;