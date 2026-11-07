export const removeVietnameseTones = str => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').trim();
};

export const formatDateTime = isoString => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateOfBirth = dateString => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const calculateAge = dateString => {
  if (!dateString) return '';
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 ? `${age} tuổi` : 'Dưới 1 tuổi';
};

export const getValueStatus = (field, value) => {
  if (value === undefined || value === '' || field.min === undefined) return 'normal';
  const numVal = parseFloat(value);
  if (isNaN(numVal)) return 'normal';
  if (numVal < field.min) return 'low';
  if (numVal > field.max) return 'high';
  return 'normal';
};

/**
 * Chuyển danh sách field của form dịch vụ (từ labForms/*.js) thành template render
 * @param {Array} fields - Danh sách field (key, label, type, options, donVi, giaTriBinhThuong, maChiSo)
 * @param {String} serviceName - Tên dịch vụ xét nghiệm
 */
export const buildTemplateFromIndicators = (fields, serviceName) => {
  if (!fields || fields.length === 0) return null;
  return {
    key: `LAB_${serviceName || 'XN'}`,
    title: serviceName || 'Xét nghiệm',
    fields: fields.map((f) => ({
      key: f.key,
      label: f.label || '',
      type: f.type || 'text',
      options: (f.options || []),
      unit: f.donVi || '',
      giaTriBinhThuong: f.giaTriBinhThuong || '',
      maChiTiet: f.maChiSo || null,
      defaultValue: ''
    }))
  };
};

export const IMAGING_TEMPLATES = {
  GENERIC: {
    key: 'CDHA_GENERIC',
    title: 'Kết quả Chẩn Đoán Hình Ảnh',
    fields: [
      { key: 'mo_ta', label: 'Mô tả hình ảnh', type: 'textarea', defaultValue: 'Không phát hiện bất thường.' }
    ]
  }
};

/**
 * Template fallback cho dịch vụ chưa có form cấu hình trong labForms/*
 * - CĐHA/imaging → textarea mô tả
 * - Xét nghiệm chưa có form → textarea kết quả tự do
 */
export const getTemplateForService = (serviceName, isImaging) => {
  if (!serviceName) return null;
  const nameLower = removeVietnameseTones(serviceName.toLowerCase());

  if (isImaging || nameLower.includes('sieu am') || nameLower.includes('x quang') || nameLower.includes('ct') || nameLower.includes('mri') || nameLower.includes('noi soi')) {
    return {
      key: 'CDHA_GENERIC',
      title: serviceName,
      fields: [
        { key: 'mo_ta', label: 'Mô tả hình ảnh', type: 'textarea', defaultValue: 'Không phát hiện bất thường.' }
      ]
    };
  }

  // Mặc định: dịch vụ xét nghiệm chưa có chỉ số → form chỉ gồm textarea tự do
  return {
    key: 'LAB_GENERIC',
    title: serviceName,
    fields: [
      { key: 'ket_qua', label: 'Kết quả xét nghiệm', type: 'textarea', defaultValue: '' }
    ]
  };
};

export const generateTextFromTemplate = (template, values, serviceName) => {
  if (!template) return '';
  const isImaging = ['ULTRASOUND', 'XRAY', 'CDHA_GENERIC'].includes(template.key);
  let text = isImaging ? `=== PHIẾU BÁO CÁO KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH ===\n\n` : `=== PHIẾU BÁO CÁO XÉT NGHIỆM LÂM SÀNG ===\n\n`;
  const title = serviceName || template.title;
  text += `Dịch vụ thực hiện: ${title.toUpperCase()}\n--------------------------------------------------------\n`;
  template.fields.forEach(f => {
    const val = values[f.key] !== undefined ? values[f.key] : f.defaultValue || '';
    if (isImaging) text += `+ ${f.label}:\n  ${val}\n\n`;
    else {
      const unit = f.unit ? ` ${f.unit}` : '';
      text += `+ ${f.label}: ${val}${unit}\n`;
    }
  });
  return text;
};