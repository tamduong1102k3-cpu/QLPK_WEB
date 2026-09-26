package com.qlpk.backend.repository;

import com.qlpk.backend.entity.NotificationQueue;
import com.qlpk.backend.entity.NotificationQueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationQueueRepository extends JpaRepository<NotificationQueue, Long> {

    List<NotificationQueue> findTop10ByStatusAndScheduledAtBeforeOrderByScheduledAtAsc(
        NotificationQueueStatus status, LocalDateTime scheduledAt);

    long countByStatus(NotificationQueueStatus status);
}
