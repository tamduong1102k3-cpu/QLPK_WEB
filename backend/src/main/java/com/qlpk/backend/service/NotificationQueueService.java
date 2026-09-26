package com.qlpk.backend.service;

import java.util.Map;

public interface NotificationQueueService {

    Map<String, Integer> processQueue();
}
