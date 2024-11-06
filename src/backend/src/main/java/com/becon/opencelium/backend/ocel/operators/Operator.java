package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.commons.Token;

public interface Operator extends Token {
    Object apply(Object o1, Object o2) throws ApplyOperatorException;

    Object apply(Object o) throws ApplyOperatorException;

    Arity getArity();

    OperatorEnum getOperatorType();

    default int getPrecedence() {
        return getOperatorType().getPrecedence();
    }

    default boolean isLeftSided() {
        return false;
    }

    default boolean isValidOperand(SidesType sidesType, Object operand) {
        return false;
    }
}