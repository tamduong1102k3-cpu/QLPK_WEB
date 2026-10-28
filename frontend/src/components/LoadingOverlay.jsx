import React from 'react';

const LoadingOverlay = ({ loading, message = 'Đang xử lý...' }) => {
  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(4px)',
      cursor: 'not-allowed'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '40px 48px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        minWidth: '220px'
      }}>
        <div className="loading-spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'loading-spin 0.8s linear infinite'
        }} />
        <p style={{
          fontSize: '15px',
          fontWeight: 600,
          color: '#475569',
          margin: 0,
          textAlign: 'center'
        }}>{message}</p>
      </div>
      <style>{`
        @keyframes loading-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;