package com.becon.opencelium.backend.ocel.operator;

import com.becon.opencelium.backend.ocel.Component;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;

public interface Operator extends Component {
    Object apply(Object o1, Object o2) throws ApplyOperatorException;

    Object apply(Object o) throws ApplyOperatorException;

    Arity getArity();

    OperatorEnum getOperatorType();

    default int getPrecedence() {
        return getOperatorType().getPrecedence();
    }

    boolean isLeftSided();

    boolean isValidOperand(SidesType side, Object operand);

    boolean isValidType(Class<?> type);

    boolean isValidType(SidesType side, Class<?> type);
}