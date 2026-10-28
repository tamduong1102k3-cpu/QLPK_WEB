import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import Stomp from 'stompjs';
import { WS_BASE_URL } from '../api/config';
import { getAccessToken } from '../api/tokenStore';

/**
 * Hook chung để subscribe WebSocket STOMP.
 *
 * @param {Object} options
 * @param {string[]} options.topics - Danh sách topic cần subscribe, ví dụ ['/topic/phieu-kham', '/topic/vitals']
 * @param {function} options.onMessage - Callback khi nhận được message, signature: (topic, data) => void
 * @param {string} options.url - URL WebSocket endpoint (mặc định: ${WS_BASE_URL}/ws)
 * @param {function} options.onConnect - Callback khi kết nối thành công
 * @param {function} options.onDisconnect - Callback khi mất kết nối
 */
const useWebSocket = ({
  topics = [],
  onMessage,
  url = `${WS_BASE_URL}/ws`,
  onConnect,
  onDisconnect,
} = {}) => {
  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      if (!mounted) return;
      const socket = new SockJS(url);
      const stompClient = Stomp.over(socket);
      stompClient.debug = () => {};
      stompClientRef.current = stompClient;

      const token = getAccessToken();
      const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      stompClient.connect(connectHeaders, () => {
        if (!mounted) return;
        if (onConnect) onConnect();

        // Subscribe tất cả topics
        topics.forEach((topic) => {
          const sub = stompClient.subscribe(topic, (message) => {
            try {
              const data = JSON.parse(message.body);
              if (onMessage) onMessage(topic, data);
            } catch (e) {
              console.error(`[useWebSocket] parse error for ${topic}:`, e);
            }
          });
          subscriptionsRef.current.push(sub);
        });
      }, (error) => {
        console.error('[useWebSocket] connection error:', error);
        if (onDisconnect) onDisconnect(error);
        // Thử reconnect sau 3s
        if (mounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      });
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      subscriptionsRef.current.forEach((sub) => {
        try { sub.unsubscribe(); } catch (e) {}
      });
      subscriptionsRef.current = [];
      if (stompClientRef.current && stompClientRef.current.connected) {
        try { stompClientRef.current.disconnect(); } catch (e) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(topics), url]);

  return stompClientRef;
};

export default useWebSocket;
