package com.becon.opencelium.backend.execution.test;

import com.becon.opencelium.backend.neo4j.entity.MethodNode;

public interface TExecutor {
    void execute(MethodNode methodNode);
}
