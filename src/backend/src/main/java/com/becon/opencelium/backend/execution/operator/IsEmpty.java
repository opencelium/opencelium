package com.becon.opencelium.backend.execution.operator;

import java.util.ArrayList;
import java.util.List;

public class IsEmpty implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        if (!(o1 instanceof List)) {
            throw new RuntimeException("IsEmpty() operator only supports List type");
        }
        return ((List<?>) o1).isEmpty();
    }
}
