package com.becon.opencelium.backend.execution.statement;

import com.becon.opencelium.backend.neo4j.entity.OperatorNode;

public interface Statement {
     void execute(OperatorNode operatorNode);
}
