package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.DataType;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

public class IsTypeOf implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        Class<?> clazz = DataType.getEnumClass((String) o2);
        if (clazz == null)
            throw ApplyOperatorException.unknownException(OperatorEnum.IS_TYPE_OF, o1, o2);
        return o1 == null || clazz.isInstance(o1);
    }

    @Override
    public Object apply(Object o) throws ApplyOperatorException {
        return Dummy.get();
    }

    @Override
    public Arity getArity() {
        return Arity.BINAR;
    }

    @Override
    public int getPrecedence() {
        return OperatorEnum.IS_TYPE_OF.getPrecedence();
    }

    @Override
    public boolean isLeftSided() {
        return false;
    }

    @Override
    public boolean applicable(String left, String right) {
        return false;
    }

    @Override
    public boolean applicable(String val) {
        return false;
    }
}
