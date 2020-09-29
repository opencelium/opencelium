package com.becon.opencelium.backend.execution.statement.operator.factory;

import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.execution.statement.operator.Operator;

public interface OperatorFactory {
     Operator getOperator(String type);
}
