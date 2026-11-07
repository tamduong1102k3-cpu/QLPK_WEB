import React from 'react';

const PrintButton = ({ 
  targetId, 
  title = "IN PHIẾU", 
  variant = "primary", // primary, success, warning, secondary
  className = "" 
}) => {
  const handlePrint = () => {
    if (!targetId) {
      window.print();
      return;
    }

    const printElement = document.getElementById(targetId);
    if (!printElement) {
      console.error(`Không tìm thấy phần tử in có ID: ${targetId}`);
      window.print();
      return;
    }

    // Tạo thẻ style tạm thời để ẩn đi tất cả phần tử khác khi in
    const style = document.createElement('style');
    style.id = 'dynamic-print-style';
    style.innerHTML = `
      @media print {
        /* Ẩn tất cả cấu trúc cha và anh em */
        body * {
          visibility: hidden !important;
        }
        /* Chỉ hiển thị phần tử đích muốn in và các con của nó */
        #${targetId}, #${targetId} * {
          visibility: visible !important;
        }
        /* Định vị phần tử in lên đầu trang */
        #${targetId} {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
        }
        /* Ẩn các nút in hoặc phần tử có class no-print */
        .no-print, .no-print * {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Kích hoạt hộp thoại in
    window.print();

    // Dọn dẹp thẻ style sau khi in xong
    setTimeout(() => {
      const addedStyle = document.getElementById('dynamic-print-style');
      if (addedStyle) {
        addedStyle.remove();
      }
    }, 1000);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100';
      case 'secondary':
        return 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-100';
      case 'primary':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100';
    }
  };

  return (
    <button
      onClick={handlePrint}
      className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 text-sm no-print ${getVariantClasses()} ${className}`}
    >
      <span className="material-symbols-outlined text-base">print</span>
      {title}
    </button>
  );
};

export default PrintButton;
