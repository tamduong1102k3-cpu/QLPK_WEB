import React from 'react';
import ReactDOM from 'react-dom';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy bỏ', type = 'primary', icon }) => {
  if (!isOpen) return null;

  const typeStyles = {
    primary: {
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
      buttonShadow: 'shadow-indigo-500/30'
    },
    danger: {
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      buttonBg: 'bg-rose-600 hover:bg-rose-700',
      buttonShadow: 'shadow-rose-500/30'
    },
    warning: {
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      buttonShadow: 'shadow-amber-500/30'
    }
  };

  const style = typeStyles[type] || typeStyles.primary;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onCancel} 
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full min-w-[360px] max-w-md p-8 border border-slate-200/50 flex flex-col text-center animate-in fade-in zoom-in-95 duration-200">
        
        {icon && (
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-4 ${style.iconBg}`}>
            <span className={`material-symbols-outlined text-[32px] ${style.iconColor}`}>
              {icon}
            </span>
          </div>
        )}
        
        {title && (
          <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
            {title}
          </h3>
        )}
        
        {message && (
          <p className="text-sm font-medium text-slate-500 leading-relaxed px-2">
            {message}
          </p>
        )}

        <div className="flex flex-row gap-3 w-full mt-8">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 px-4 bg-slate-50 text-slate-600 font-bold text-sm rounded-xl border border-slate-200/80 hover:bg-slate-100 transition-colors"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`flex-1 py-3.5 px-4 text-white font-bold text-sm rounded-xl border border-transparent shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${style.buttonBg} ${style.buttonShadow}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;