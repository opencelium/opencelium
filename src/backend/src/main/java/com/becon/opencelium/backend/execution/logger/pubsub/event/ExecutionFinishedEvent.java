package com.becon.opencelium.backend.execution.logger.pubsub.event;

import com.becon.opencelium.backend.quartz.QuartzJobScheduler;

public record ExecutionFinishedEvent(
        long executionId,
        int schedulerId,
        QuartzJobScheduler.TriggerType type,
        String result
) implements ExecutionEvent {
}
