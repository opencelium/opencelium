package com.becon.opencelium.backend.execution.log_managing.trackers;

import com.becon.opencelium.backend.execution.log_managing.commons.LogTrackerType;
import com.becon.opencelium.backend.execution.log_managing.core.LogElementTracker;

public abstract class LogTrackerFactory {
    public static LogElementTracker initTracker(LogTrackerType type) {
        return switch (type) {
            case METHOD -> new MethodTracker();
            case LOOP -> new LoopTracker();
            case IF -> new IfTracker();
        };
    }
}
