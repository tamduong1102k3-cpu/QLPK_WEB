package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.NotificationQueue;
import com.qlpk.backend.entity.NotificationQueueStatus;
import com.qlpk.backend.entity.ThongBao;
import com.qlpk.backend.repository.NotificationQueueRepository;
import com.qlpk.backend.repository.ThongBaoRepository;
import com.qlpk.backend.service.NotificationQueueService;
import com.qlpk.backend.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class NotificationQueueServiceImpl implements NotificationQueueService {

    private static final Logger log = LoggerFactory.getLogger(NotificationQueueServiceImpl.class);
    private static final int MAX_RETRY = 3;

    @Autowired
    private NotificationQueueRepository notificationQueueRepository;

    @Autowired
    private ThongBaoRepository thongBaoRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Override
    @Transactional
    public Map<String, Integer> processQueue() {
        LocalDateTime now = LocalDateTime.now();
        List<NotificationQueue> pendingItems = notificationQueueRepository
            .findTop10ByStatusAndScheduledAtBeforeOrderByScheduledAtAsc(
                NotificationQueueStatus.PENDING, now);

        int processed = 0;
        int sent = 0;
        int failed = 0;

        for (NotificationQueue item : pendingItems) {
            processed++;
            try {

                item.setStatus(NotificationQueueStatus.PROCESSING);
                item.setLastAttemptAt(now);
                notificationQueueRepository.save(item);

                Optional<ThongBao> thongBaoOpt = thongBaoRepository.findById(item.getMaThongBao());
                if (thongBaoOpt.isEmpty()) {
                    log.warn("ThongBao #{} not found for queue item #{}. Marking as FAILED.", 
                        item.getMaThongBao(), item.getId());
                    item.setStatus(NotificationQueueStatus.FAILED);
                    item.setErrorMessage("ThongBao not found: " + item.getMaThongBao());
                    notificationQueueRepository.save(item);
                    failed++;
                    continue;
                }

                ThongBao thongBao = thongBaoOpt.get();

                Long referenceIdLong = null;
                if (thongBao.getReferenceId() != null) {
                    try {
                        referenceIdLong = Long.parseLong(thongBao.getReferenceId());
                    } catch (NumberFormatException ignored) {

                    }
                }

                boolean fcmSuccess = pushNotificationService.sendFcmToUser(
                    thongBao.getMaTaiKhoan(),
                    thongBao.getTieuDe(),
                    thongBao.getNoiDung(),
                    thongBao.getReferenceType(),
                    referenceIdLong
                );

                if (fcmSuccess) {

                    item.setStatus(NotificationQueueStatus.SENT);
                    item.setSentAt(LocalDateTime.now());
                    notificationQueueRepository.save(item);

                    thongBao.setDaGuiPush(true);
                    thongBaoRepository.save(thongBao);
                    sent++;
                    log.info("Queue item #{} sent FCM for ThongBao #{}", item.getId(), item.getMaThongBao());
                } else {

                    handleFailure(item, "No device token or FCM send returned false");
                    failed++;
                }
            } catch (Exception e) {
                log.error("Error processing queue item #{}: {}", item.getId(), e.getMessage());
                handleFailure(item, e.getMessage());
                failed++;
            }
        }

        Map<String, Integer> result = new HashMap<>();
        result.put("processed", processed);
        result.put("sent", sent);
        result.put("failed", failed);
        log.info("Queue processing completed: processed={}, sent={}, failed={}", processed, sent, failed);
        return result;
    }

    private void handleFailure(NotificationQueue item, String errorMessage) {
        int currentRetry = (item.getRetryCount() != null ? item.getRetryCount() : 0) + 1;
        item.setRetryCount(currentRetry);
        item.setErrorMessage(errorMessage);

        if (currentRetry < MAX_RETRY) {

            item.setStatus(NotificationQueueStatus.PENDING);
            log.info("Queue item #{} will retry (attempt {}/{})", item.getId(), currentRetry, MAX_RETRY);
        } else {

            item.setStatus(NotificationQueueStatus.FAILED);
            log.warn("Queue item #{} failed after {} retries. Marking as FAILED.", item.getId(), MAX_RETRY);
        }
        notificationQueueRepository.save(item);
    }
}
