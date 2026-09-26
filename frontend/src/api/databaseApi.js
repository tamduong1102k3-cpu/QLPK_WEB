import fetchClient from "./fetchClient";
import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/database`;

const handleError = async (response) => {
  let errorMsg = `Lỗi: ${response.status}`;
  try {
    const text = await response.text();
    if (text) {
      try {
        const errorData = JSON.parse(text);
        errorMsg = errorData.message || errorMsg;
      } catch {
        errorMsg = text;
      }
    }
  } catch { /* ignore */ }
  throw new Error(errorMsg);
};

export const getDatabaseInfoApi = async () => {
  const response = await fetchClient(`${API_URL}/info`);
  if (!response.ok) await handleError(response);
  return response.json();
};

export const listBackupsApi = async () => {
  const response = await fetchClient(`${API_URL}/backups`);
  if (!response.ok) await handleError(response);
  const data = await response.json();
  return data.backups || [];
};

export const createBackupApi = async () => {
  const response = await fetchClient(`${API_URL}/backup`, { method: "POST" });
  if (!response.ok) await handleError(response);
  return response.json();
};

export const restoreBackupApi = async (filename) => {
  const response = await fetchClient(
    `${API_URL}/restore/${encodeURIComponent(filename)}`,
    {
      method: "POST",
    },
  );
  if (!response.ok) await handleError(response);
  return response.json();
};
