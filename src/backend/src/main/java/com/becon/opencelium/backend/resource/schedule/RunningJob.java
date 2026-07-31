package com.becon.opencelium.backend.resource.schedule;

public record RunningJob(
        long connectionId,
        int schedulerId,
        long execId
) {
}
