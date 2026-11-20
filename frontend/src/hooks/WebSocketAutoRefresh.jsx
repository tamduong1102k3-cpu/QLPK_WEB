import React, { useEffect, useRef } from 'react';
import useWebSocket from '../hooks/useWebSocket';

/**
 * Component wrapper giúp tự động gọi callback khi nhận message từ WebSocket.
 * Đặt component này bên trong các BangDieuKhien và truyền callback để refresh data.
 *
 * @param {Object} props
 * @param {string[]} props.topics - Danh sách topic subscribe
 * @param {function} props.onMessage - Callback (topic, data) => void
 * @param {number} props.debounceMs - Debounce time (mặc định 300ms)
 */
const WebSocketAutoRefresh = ({ topics = [], onMessage, debounceMs = 300 }) => {
  const lastCallRef = useRef({});
  const timeoutRef = useRef(null);

  useWebSocket({
    topics,
    onMessage: (topic, data) => {
      // Debounce các message liên tiếp
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const now = Date.now();
      const key = `${topic}-${JSON.stringify(data).slice(0, 200)}`;

      // Bỏ qua nếu cùng message trong vòng 500ms
      if (lastCallRef.current.key === key && now - lastCallRef.current.ts < 500) {
        return;
      }
      lastCallRef.current = { key, ts: now };

      timeoutRef.current = setTimeout(() => {
        if (onMessage) onMessage(topic, data);
      }, debounceMs);
    },
  });

  return null;
};

export default WebSocketAutoRefresh;
