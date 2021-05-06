package com.becon.opencelium.backend.execution.statement.operator;

import com.becon.opencelium.backend.enums.DataTypeEnum;


public class IsTypeOf implements Operator {
    @Override
    public <T, S> boolean compare(T val1, S val2) {
        DataTypeEnum type = DataTypeEnum.getEnumType((String) val2);
        Class clazz = DataTypeEnum.getClass(type);
        return clazz != null && clazz.isInstance(val1);
    }
}
