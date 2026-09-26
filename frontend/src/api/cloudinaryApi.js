import { API_BASE_URL } from './config';
/**
 * Cloudinary API - Upload ảnh lên Cloudinary thông qua backend
 * Backend endpoint: POST /api/images/upload
 */

const CLOUDINARY_UPLOAD_URL = `${API_BASE_URL}/images/upload`;

/**
 * Upload file ảnh lên Cloudinary
 * @param {File} file - File ảnh cần upload
 * @returns {Promise<string>} - URL ảnh trên Cloudinary
 */
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Upload ảnh thất bại');
    }

    const url = await response.text();
    return url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export default uploadToCloudinary;