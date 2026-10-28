// Map mã dịch vụ → form config tương ứng (thiết kế riêng cho từng dịch vụ xét nghiệm)
import formCBC from './formDichVu_CBC';
import formGlucose from './formDichVu_Glucose';
import formMoMau from './formDichVu_MoMau';
import formGan from './formDichVu_Gan';
import formThan from './formDichVu_Than';
import formNuocTieu from './formDichVu_NuocTieu';
import formNhomMau from './formDichVu_NhomMau';
import formViemGanB from './formDichVu_ViemGanB';

export const LAB_SERVICE_FORMS = {
  7: formCBC,
  8: formGlucose,
  9: formMoMau,
  10: formGan,
  11: formThan,
  12: formNuocTieu,
  13: formNhomMau,
  14: formViemGanB
};

/**
 * Lấy cấu hình form riêng cho một dịch vụ xét nghiệm theo mã dịch vụ
 * @param {Number|String} maDichVu - Mã dịch vụ
 * @returns {Object|null} Cấu hình form (maDichVu, tenDichVu, fields) hoặc null nếu chưa có
 */
export const getLabForm = (maDichVu) => {
  if (maDichVu === undefined || maDichVu === null) return null;
  return LAB_SERVICE_FORMS[Number(maDichVu)] || null;
};