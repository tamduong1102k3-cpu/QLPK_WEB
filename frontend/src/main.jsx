import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ensureAuthenticated } from './api/accountApi'

const boot = async () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('maNhanVien');
  } catch {}

  try {
    await ensureAuthenticated();
  } catch (e) {
    console.warn('Không thể khôi phục phiên:', e);
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

boot();