package com.qlpk.backend.payment;

import com.qlpk.backend.config.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;


@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompAuthInterceptor.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${app.ws.auth-enforce:false}")
    private boolean enforce;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand cmd = accessor.getCommand();
        if (cmd == null) return message;

        // CONNECT: đọc JWT từ header, set User vào session STOMP
        if (StompCommand.CONNECT.equals(cmd)) {
            handleConnect(accessor);
        }
        // SUBSCRIBE: check principal tồn tại + ownership cho /topic/thong-bao/{id}
        else if (StompCommand.SUBSCRIBE.equals(cmd)) {
            handleSubscribe(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        String token = null;
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String raw = authHeaders.get(0);
            if (raw != null && raw.startsWith("Bearer ")) {
                token = raw.substring(7);
            }
        }

        if (token == null || !jwtUtils.validateToken(token)) {
            String msg = "WS CONNECT without valid token";
            if (enforce) {
                throw new MessageDeliveryException(msg);
            } else {
                log.warn("[WS-LOG] {} (enforce=false, allowing)", msg);
            }
            return;
        }

        String username = jwtUtils.getUsernameFromToken(token);
        String role = jwtUtils.getRoleFromToken(token);
        if (username == null || role == null) {
            String msg = "WS CONNECT invalid claims";
            if (enforce) throw new MessageDeliveryException(msg);
            log.warn("[WS-LOG] {}", msg);
            return;
        }

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        accessor.setUser(auth);
        // Lưu ID vào session attributes để check ownership ở SUBSCRIBE
        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
        if (sessionAttrs != null) {
            Integer maBn = jwtUtils.getMaTaiKhoanBnFromToken(token);
            Integer maNv = jwtUtils.getMaTaiKhoanFromToken(token);
            if (maBn != null && maBn > 0) sessionAttrs.put("maTaiKhoanBn", maBn);
            if (maNv != null && maNv > 0) sessionAttrs.put("maTaiKhoan", maNv);
        } else {
            log.warn("[WS-LOG] sessionAttributes null for user={}", username);
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        if (accessor.getUser() == null) {
            String msg = "WS SUBSCRIBE without authenticated principal: " + accessor.getDestination();
            if (enforce) throw new MessageDeliveryException(msg);
            log.warn("[WS-LOG] {}", msg);
            return;
        }

        String dest = accessor.getDestination();
        if (dest == null) return;

        // Ownership check cho /topic/thong-bao/{id}
        if (dest.startsWith("/topic/thong-bao/")) {
            String idStr = dest.substring("/topic/thong-bao/".length());
            try {
                int requestedId = Integer.parseInt(idStr);

                Map<String, Object> attrs = accessor.getSessionAttributes();
                Integer myBn = (attrs != null) ? (Integer) attrs.get("maTaiKhoanBn") : null;
                Integer myNv = (attrs != null) ? (Integer) attrs.get("maTaiKhoan") : null;

                boolean isOwner = (myBn != null && myBn == requestedId)
                               || (myNv != null && myNv == requestedId);

                if (!isOwner) {
                    String msg = "WS SUBSCRIBE forbidden topic: " + dest
                        + " userBn=" + myBn + " userNv=" + myNv;
                    if (enforce) throw new MessageDeliveryException(msg);
                    log.warn("[WS-LOG] {}", msg);
                }
            } catch (NumberFormatException e) {
                String msg = "WS SUBSCRIBE invalid topic id: " + dest;
                if (enforce) throw new MessageDeliveryException(msg);
                log.warn("[WS-LOG] {}", msg);
            }
        }
    }
}
