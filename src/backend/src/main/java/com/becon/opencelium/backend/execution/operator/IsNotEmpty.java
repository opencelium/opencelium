package com.becon.opencelium.backend.execution.operator;

import java.util.ArrayList;
import java.util.List;

public class IsNotEmpty implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        if (!(o1 instanceof List)) {
            throw new RuntimeException("IsNotEmpty() operator only supports List type");
        }
        return  !(new IsEmpty()).apply(o1, o2);
    }
}
