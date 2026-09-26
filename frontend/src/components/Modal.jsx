import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

/**
 * Reusable Modal component with:
 * - React Portal rendering to document.body
 * - position: fixed overlay covering full viewport
 * - Flexbox centering (align-items: center, justify-content: center)
 * - Scroll lock on body when open
 * - Backdrop click to close
 * - Proper z-index (9999)
 * - Overflow handling for content
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  maxWidth = '800px',
  zIndex = 9999,
  closeOnBackdrop = true,
  showCloseButton = false,
  padding = '20px',
  contentPadding = '0',
  borderRadius = '12px',
  unstyled = false,
}) => {
  // Scroll lock: prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key to close
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.5)',
        zIndex: zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: padding,
        boxSizing: 'border-box',
      }}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        style={unstyled ? {
          width: '100%',
          maxWidth: maxWidth,
          position: 'relative'
        } : {
          background: '#fff',
          borderRadius: borderRadius,
          maxWidth: maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          position: 'relative',
          padding: contentPadding,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              zIndex: 1,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')
            }
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;