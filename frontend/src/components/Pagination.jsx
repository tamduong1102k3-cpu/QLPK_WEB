import React from 'react';

/**
 * Component phân trang dùng chung.
 *
 * Props:
 *   currentPage   - trang hiện tại
 *   totalPages    - tổng số trang
 *   totalItems    - tổng số item (hiển thị ở label)
 *   label         - nhãn item, VD: "lịch khám", "phiếu", "bệnh nhân"
 *   visiblePages  - mảng trang hiển thị (VD: [1, 2, '...', 8, 9]) từ usePagination
 *   onPageChange  - hàm đổi trang: (page) => void
 *   jumpPage      - giá trị ô nhập trang nhanh
 *   setJumpPage   - setter ô nhập trang nhanh
 *   onJumpPage    - hàm xử lý khi nhập (từ usePagination.handleJumpPage)
 *   onJumpBlur    - hàm khi blur ô nhập (từ usePagination.handleJumpPageBlur)
 *
 * Tùy biến màu (Tailwind mode):
 *   activeClass   - class nút trang đang active (mặc định indigo)
 *   hoverClass    - class hover nút trang / prev / next
 *   ringClass     - class focus ring ô nhập trang
 *   disabledClass - class nút bị disable
 *
 * Mode inline style (dùng cho component có style inline, VD QuanLyBenhNhan):
 *   mode="inline" - dùng màu xanh #2563eb
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  label = 'mục',
  visiblePages = [],
  onPageChange,
  jumpPage = '',
  setJumpPage = () => {},
  onJumpPage = () => {},
  onJumpBlur = () => {},
  mode = 'tailwind',
  activeClass,
  hoverClass,
  ringClass,
  disabledClass,
}) => {
  const showTop = Math.min(currentPage, totalPages);
  const showBottom = totalItems;

  const text = `Trang ${showTop}/${totalPages} • ${showBottom} ${label}`;

  // ── Mode inline style (giống QuanLyBenhNhan) ──
  if (mode === 'inline') {
    const btnBase = {
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      background: '#fff',
      color: '#6b7280',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 600,
    };
    const btnDisabled = (isDisabled) => ({
      ...btnBase,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      color: isDisabled ? '#d1d5db' : '#6b7280',
      background: isDisabled ? '#fff' : '#fff',
    });

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderTop: '1px solid #f3f4f6',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>{text}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
            disabled={showTop === 1}
            style={btnDisabled(showTop === 1)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
          </button>
          {visiblePages.map((p, i) =>
            p === '...' ? (
              <span key={`e-${i}`} style={{ padding: '0 6px', fontSize: '13px', color: '#9ca3af' }}>...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange && onPageChange(p)}
                style={{
                  ...btnBase,
                  border: p === showTop ? '1px solid #2563eb' : '1px solid #e5e7eb',
                  background: p === showTop ? '#2563eb' : '#fff',
                  color: p === showTop ? '#fff' : '#6b7280',
                }}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={showTop === totalPages}
            style={btnDisabled(showTop === totalPages)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
          </button>
        </div>
        {jumpPage !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
            <span>Đến trang</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => onJumpPage(e.target.value)}
              onBlur={onJumpBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') onJumpBlur(); }}
              placeholder={String(showTop)}
              style={{
                width: '52px',
                padding: '5px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Mode Tailwind (mặc định) ──
  const defaultActiveClass = 'bg-indigo-600 text-white shadow-md shadow-indigo-100';
  const defaultHoverClass = 'hover:bg-indigo-50 hover:text-indigo-600';
  const defaultRingClass = 'focus:ring-2 focus:ring-indigo-200';
  const defaultDisabledClass = 'text-gray-300 cursor-not-allowed';

  const active = activeClass || defaultActiveClass;
  const hover = hoverClass || defaultHoverClass;
  const ring = ringClass || defaultRingClass;
  const disabled = disabledClass || defaultDisabledClass;

  const btn = (isDisabled, customHover = hover) =>
    `w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
      isDisabled ? disabled : `text-gray-600 ${customHover}`
    }`;

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-3">
      <span className="text-xs font-semibold text-gray-400">{text}</span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
          disabled={showTop === 1}
          className={btn(showTop === 1)}
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>

        {visiblePages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange && onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                p === showTop ? active : `text-gray-500 ${hover}`
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={showTop === totalPages}
          className={btn(showTop === totalPages)}
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>

      {jumpPage !== undefined && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
          <span>Đến trang</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpPage}
            onChange={(e) => onJumpPage(e.target.value)}
            onBlur={onJumpBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') onJumpBlur(); }}
            placeholder={String(showTop)}
            className={`w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 focus:outline-none ${ring}`}
          />
        </div>
      )}
    </div>
  );
};

export default Pagination;