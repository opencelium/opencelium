package com.becon.opencelium.backend.execution.operator.factory;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.operator.Operator;

public interface OperatorFactory {
     Operator getOperator(RelationalOperator type);
}
