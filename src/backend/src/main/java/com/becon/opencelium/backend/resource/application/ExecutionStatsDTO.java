package com.becon.opencelium.backend.resource.application;

public record ExecutionStatsDTO(
        int totalExecs,
        int totalFailed,
        long totalRuntime,
        long avgRuntime
) {}
