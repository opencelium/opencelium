package com.becon.opencelium.backend.execution.operator.factory;

import com.becon.opencelium.backend.execution.operator.Operator;

public interface OperatorFactory {
     Operator getOperator(String type);
}
