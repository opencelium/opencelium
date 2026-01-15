package com.becon.opencelium.backend.ocel.operator;

public interface BinaryOperator extends Operator {
    @Override
    default Object apply(Object o) {
        return Dummy.get();
    }

    @Override
    default boolean isValidType(Class<?> type) {
        return false;
    }

    @Override
    default boolean isLeftSided() {
        return false;
    }

    @Override
    default Arity getArity() {
        return Arity.BINARY;
    }
}
