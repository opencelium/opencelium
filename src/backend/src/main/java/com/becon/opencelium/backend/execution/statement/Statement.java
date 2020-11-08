package com.becon.opencelium.backend.execution.statement;

import com.becon.opencelium.backend.neo4j.entity.StatementNode;

public interface Statement {
     void execute(StatementNode statementNode);
}
