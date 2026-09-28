package com.becon.opencelium.backend.execution.logger.pubsub.event;

import com.becon.opencelium.backend.quartz.QuartzJobScheduler;

public record ExecutionFinishedEvent(
        long executionId,
        QuartzJobScheduler.TriggerType type,
        String result
) implements ExecutionEvent {
}
