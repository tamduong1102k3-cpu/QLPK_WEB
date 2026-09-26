/**
 * Generic API client wrapper - tự động gắn JWT, handle 401 auto-logout
 * Sử dụng fetchClient thay vì fetch trực tiếp
 */
import fetchClient, { handleUnauthorized } from './fetchClient';
import { API_BASE_URL } from './config';

export { handleUnauthorized };

/**
 * apiClient(url, options) - wrapper tương thích ngược với code cũ
 */
export const apiClient = async (url, options = {}) => {
  const method = options.method ? options.method.toUpperCase() : 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  const path = url.replace(API_BASE_URL, '');

  try {
    // Thử dispatch qua các API chuyên biệt (các function này đã dùng fetchClient)
    const result = await dispatchToApi(path, method, body, url);
    return {
      ok: true,
      json: async () => result,
      text: async () => typeof result === 'string' ? result : JSON.stringify(result)
    };
  } catch (error) {
    console.error('apiClient error:', error);
    // Fallback: dùng fetchClient (tự động gắn JWT + handle 401)
    try {
      const res = await fetchClient(url, {
        ...options,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      return res;
    } catch (fetchError) {
      return {
        ok: false,
        json: async () => ({ message: fetchError.message }),
        text: async () => fetchError.message
      };
    }
  }
};

const dispatchToApi = async (path, method, body, url) => {
  // 1. Benh Nhan
  if (path.startsWith('/benh-nhan')) {
    if (path.includes('/search')) return await benhNhanApi.searchApi({ keyword: new URL(url).searchParams.get('keyword') });
    else if (path.includes('/ho-so')) return await benhNhanApi.getHoSoApi(path.split('/')[2]);
    else if (method === 'GET') return await benhNhanApi.getAllApi();
    else if (method === 'POST') return await benhNhanApi.createApi(body);
    else if (method === 'PUT') return await benhNhanApi.updateApi(path.split('/')[2], body);
  }
  // 2. Dich Vu
  else if (path.startsWith('/dich-vu')) {
    if (method === 'GET') return await dichVuApi.getAllApi();
    else if (method === 'POST') return await dichVuApi.createApi(body);
    else if (method === 'PUT') return await dichVuApi.updateApi(path.split('/')[2], body);
    else if (method === 'DELETE') return await dichVuApi.deleteApi(path.split('/')[2]);
  }
  // 3. Danh Muc (Phong, Chuyen Khoa)
  else if (path.startsWith('/phong')) {
    if (method === 'GET') return await danhMucApi.getAllPhongApi();
    else if (method === 'POST') return await danhMucApi.createPhongApi(body);
    else if (method === 'PUT') return await danhMucApi.updatePhongApi(path.split('/')[2], body);
    else if (method === 'DELETE') return await danhMucApi.deletePhongApi(path.split('/')[2]);
  }
  else if (path.startsWith('/chuyen-khoa')) {
    if (method === 'GET') return await danhMucApi.getAllChuyenKhoaApi();
  }
  // 4. Hoa Don
  else if (path.startsWith('/hoa-don')) {
    if (path.includes('/chi-tiet')) return await hoaDonApi.getChiTietApi(path.split('/')[2]);
    else if (method === 'GET') return await hoaDonApi.getAllApi();
    else if (method === 'PUT') return null;
  }
  // 5. Lich Hen
  else if (path.startsWith('/lich-hen')) {
    if (method === 'GET') return await appointmentApi.getAllApi();
    else if (method === 'POST') return null;
    else if (method === 'PUT') return await appointmentApi.updateApi(path.split('/')[2], body);
    else if (method === 'DELETE') return await appointmentApi.deleteApi(path.split('/')[2]);
  }
  // 6. Tai Khoan / Nhan Vien
  else if (path.startsWith('/tai-khoan')) {
    if (method === 'GET') return await authApi.getAllApi();
    else if (method === 'POST') return await authApi.createApi(body);
    else if (method === 'PUT') {
      if (path.includes('/change-password')) {
        const id = path.split('/')[2];
        return await authApi.changePasswordApi(id, body);
      }
      return await authApi.updateApi(path.split('/')[2], body);
    }
    else if (method === 'DELETE') return await authApi.deleteApi(path.split('/')[2]);
  }
  else if (path.startsWith('/nhan-vien') || path.startsWith('/nhan_vien')) {
    if (method === 'GET') return await employeeApi.getAllNhanVienApi();
  }
  // 7. Kho Thuoc / Thuoc
  else if (path.startsWith('/kho-thuoc/phieu-nhap')) {
    const subPath = path.replace('/kho-thuoc', '');
    if (subPath.includes('/chi-tiet')) return await khoThuocApi.getChiTietPhieuNhapApi(subPath.split('/')[3]);
    else if (method === 'GET') return await khoThuocApi.getAllPhieuNhapApi();
    else if (method === 'POST') return await khoThuocApi.createPhieuNhapApi(body);
  }
  else if (path.startsWith('/thuoc') || path.startsWith('/kho-thuoc/thuoc')) {
    // ID nằm ở vị trí khác nhau tùy đường dẫn:
    // - /thuoc/{id}           -> id ở index [2]
    // - /kho-thuoc/thuoc/{id}  -> id ở index [3]
    const thuocId = path.startsWith('/kho-thuoc/thuoc') ? path.split('/')[3] : path.split('/')[2];
    if (method === 'GET') return await khoThuocApi.getAllThuocApi();
    else if (method === 'POST') return await khoThuocApi.createThuocApi(body);
    else if (method === 'PUT') return await khoThuocApi.updateThuocApi(thuocId, body);
    else if (method === 'DELETE') return await khoThuocApi.deleteThuocApi(thuocId);
  }
  else if (path.startsWith('/phieu-nhap')) {
    if (path.includes('/chi-tiet')) return await khoThuocApi.getChiTietPhieuNhapApi(path.split('/')[2]);
    else if (method === 'GET') return await khoThuocApi.getAllPhieuNhapApi();
    else if (method === 'POST') return await khoThuocApi.createPhieuNhapApi(body);
  }
  else if (path.startsWith('/kho-thuoc/sap-het')) {
    const threshold = new URL(url).searchParams.get('threshold') || 20;
    return await khoThuocApi.getThuocSapHetApi(Number(threshold));
  }
  else if (path.startsWith('/dang-ky')) {
    if (path.includes('/status')) return await dangKyApi.updateStatusApi(path.split('/')[2], body);
    else if (method === 'GET') return await dangKyApi.getTodayApi();
    else if (method === 'POST') return null;
  }
  else if (path.startsWith('/phieu-kham')) {
    if (path.includes('/full-check-in')) return await phieuKhamApi.fullCheckInApi(body);
    else if (path.includes('/accept-patient')) return await phieuKhamApi.acceptPatientApi(path.split('/')[3], { assistantId: new URL(url).searchParams.get('assistantId') });
    else if (path.includes('/finish')) return await phieuKhamApi.finishConsultationApi(path.split('/')[3]);
    else if (path.includes('/completed-patients')) {
      const r = await fetchClient(url, { method: 'GET' });
      if (!r.ok) throw new Error('Lỗi: ' + r.status);
      return await r.json();
    }
    else if (path.includes('/specialty-history')) {
      return await phieuKhamApi.getSpecialtyHistoryApi(new URL(url).searchParams.get('maChuyenKhoa'));
    }
    else if (method === 'PUT') return await phieuKhamApi.updateApi(path.split('/')[2], body);
  }
  // 10. Chi So Kham
  else if (path.startsWith('/chi-so-kham-tong-hop') || path.startsWith('/chi-so-tong-hop')) {
    if (path.includes('/phieu-kham')) return await chiSoKhamApi.getByPhieuKhamApi(path.split('/')[3]);
    else if (path.includes('/save-and-update')) return await chiSoKhamApi.saveAndUpdateApi(body);
    else if (method === 'POST') return await chiSoKhamApi.createApi(body);
  }
  // 11. Phieu Chi Dinh
  else if (path.startsWith('/phieu-chi-dinh')) {
    if (path.includes('/phieu-kham') && path.includes('/result-cdha')) return await phieuChiDinhApi.getCdhaResultsByPhieuKhamApi(path.split('/')[3]);
    else if (path.includes('/phieu-kham') && path.includes('/result-xet-nghiem')) return await phieuChiDinhApi.getXetNhiemResultsByPhieuKhamApi(path.split('/')[3]);
    else if (path.includes('/phieu-kham')) return await phieuChiDinhApi.getByPhieuKhamApi(path.split('/')[3]);
    else if (path.includes('/details')) return await phieuChiDinhApi.getDetailsApi(path.split('/')[2]);
    else if (path.includes('/pending-tests')) return await phieuChiDinhApi.getPendingTestsApi({ maChuyenKhoa: new URL(url).searchParams.get('maChuyenKhoa') });
    else if (path.includes('/completed-tests-today')) return await phieuChiDinhApi.getCompletedTestsTodayApi({ maChuyenKhoa: new URL(url).searchParams.get('maChuyenKhoa') });
    else if (path.includes('/result-cdha')) return await phieuChiDinhApi.getCdhaResultApi(path.split('/')[3]);
    else if (path.includes('/upload-image')) return await phieuChiDinhApi.uploadImageApi(body);
    else if (path.includes('/submit-result')) return await phieuChiDinhApi.submitTestResultApi(body);
    else if (path.includes('/approve-cdha')) return await phieuChiDinhApi.approveCdhaResultApi(path.split('/')[3], body);
    else if (path.includes('/reject-cdha')) return await phieuChiDinhApi.rejectCdhaResultApi(path.split('/')[3], body);
    else if (path.includes('/approve-result')) return await phieuChiDinhApi.approveTestResultApi(path.split('/')[3], body);
    else if (path.includes('/reject-result')) return await phieuChiDinhApi.rejectTestResultApi(path.split('/')[3], body);
    else if (method === 'POST') return await phieuChiDinhApi.createApi(body);
  }
  // 12. Toa Thuoc
  else if (path.startsWith('/toa-thuoc')) {
    if (path.includes('/phieu-kham')) return await toaThuocApi.getByPhieuKhamApi(path.split('/')[3]);
    else if (path.includes('/details')) return await toaThuocApi.getDetailsApi(path.split('/')[2]);
    else if (method === 'POST') return await toaThuocApi.createApi(body);
  }
  else if (path.startsWith('/kham-lam-sang')) {
    if (path.includes('/phieu-kham')) return await khamLamSangApi.getByPhieuKhamApi(path.split('/')[3]);
    else if (method === 'POST') return await khamLamSangApi.saveApi(body);
  }
  // 14. Ket Qua
  else if (path.startsWith('/ket-qua-xet-nghiem')) {
    if (path.includes('/phieu-kham')) return null;
  }
  else if (path.startsWith('/ket-qua-cdha')) {
    if (path.includes('/phieu-kham')) return null;
  }
  // 15. Thong Ke
  else if (path.startsWith('/thong-ke')) {
    if (path.includes('/dashboard-summary')) return await statisticsApi.getDashboardSummaryApi();
    else if (path.includes('/theo-nam')) return await statisticsApi.namCoDuLieuApi();
  }
  // 16. Payment
  else if (path.startsWith('/payment')) {
    const r = await fetchClient(url, { 
      method, 
      headers: {
        'Content-Type': 'application/json'
      },
      ...(body ? { body: JSON.stringify(body) } : {}) 
    });
    if (!r.ok) {
      const errText = await r.text();
      let errJson;
      try { errJson = JSON.parse(errText); } catch(e) {}
      throw new Error(errJson?.error || errText || 'Lỗi xử lý thanh toán');
    }
    // Check if the response body is empty (e.g. mockSuccess returning 200 OK without body)
    const text = await r.text();
    return text ? JSON.parse(text) : {};
  }

  throw new Error(`No API match for: ${method} ${path}`);
};

import * as authApi from './accountApi';
import * as benhNhanApi from './benhNhanApi';
import * as dangKyApi from './dangKyKhamBenhApi';
import * as phieuKhamApi from './phieuKhamApi';
import * as dichVuApi from './dichVuApi';
import * as danhMucApi from './danhMucApi';
import * as hoaDonApi from './hoaDonApi';
import * as appointmentApi from './appointmentApi';
import * as khoThuocApi from './khoThuocApi';
import * as chiSoKhamApi from './chiSoKhamTongHopApi';
import * as phieuChiDinhApi from './phieuChiDinhApi';
import * as toaThuocApi from './toaThuocApi';
import * as khamLamSangApi from './khamLamSangApi';
import * as statisticsApi from './statisticsApi';
import * as employeeApi from './employeeApi';