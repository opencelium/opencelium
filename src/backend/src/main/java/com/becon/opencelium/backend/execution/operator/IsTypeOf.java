package com.becon.opencelium.backend.execution.operator;

import com.becon.opencelium.backend.enums.DataTypeEnum;

public class IsTypeOf implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        DataTypeEnum type = DataTypeEnum.getEnumType((String) o2);
        Class clazz = DataTypeEnum.getClass(type);

        return clazz != null && clazz.isInstance(o1);
    }
}
