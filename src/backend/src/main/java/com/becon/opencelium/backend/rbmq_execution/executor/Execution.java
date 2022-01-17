package com.becon.opencelium.backend.rbmq_execution.executor;

import com.becon.opencelium.backend.rbmq_execution.mediator.ExecutionContext;

public interface Execution {
    void start(ExecutionContext data);
//    void stop();
//    void resume();
//    void pause();
//    void restart();
}
