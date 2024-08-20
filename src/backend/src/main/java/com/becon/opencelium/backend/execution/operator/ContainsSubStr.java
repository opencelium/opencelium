package com.becon.opencelium.backend.execution.operator;

import java.util.ArrayList;
import java.util.List;

public class ContainsSubStr implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {

        List values;
        Object value = o2;

        if (o2 instanceof List) {
            // if 'o2' is a list then 'o2'[1] should contain 'o2'[0]
            List list = (List) o2;

            values = (List) list.get(1);
            value = list.get(0);
        } else {
            values = (List) o1;
        }

        for (Object o : values) {
            if (!(o instanceof String str)) {
                throw new RuntimeException("ContainsSubStr operator does not support '" + o.getClass() + "' type");
            }

            if (str.contains(value.toString())) {
                return true;
            }
        }

        return false;
    }
}
