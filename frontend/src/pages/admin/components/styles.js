export const card = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,.06)'
};

export const th = {
  padding: '11px 16px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
  whiteSpace: 'nowrap'
};

export const td = {
  padding: '12px 16px',
  fontSize: '14px',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6'
};

export const formatCurrency = v =>
  v == null ? '—' : new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(v);

export const formatDate = s => {
  if (!s) return '—';
  return new Date(s).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};