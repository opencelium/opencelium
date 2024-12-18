package com.becon.opencelium.backend.ocel.operator;

import com.becon.opencelium.backend.ocel.common.Dummy;

public interface UnaryOperator extends Operator {
    @Override
    default Object apply(Object o1, Object o2) {
        return Dummy.get();
    }

    @Override
    default boolean isValidOperand(SidesType sidesType, Object operand) {
        return false;
    }

    @Override
    default boolean isValidType(SidesType side, Class<?> type) {
        return false;
    }

    @Override
    default boolean isLeftSided() {
        return false;
    }
}
