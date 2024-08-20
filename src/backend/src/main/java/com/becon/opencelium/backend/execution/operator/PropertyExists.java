package com.becon.opencelium.backend.execution.operator;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class PropertyExists implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {


        // for the case when user extracts names of fields via keys() function
        if (o1 instanceof Set set) {
            return set.contains(o2);
        }

        if (!(o1 instanceof Map object)) {
            throw new RuntimeException("PropertyExists doesn't support the " + o1.getClass() +
                    ". Please ensure that the left value is of type List or Map." +
                    " Please use keys() or the object itself and be sure that the object is not Array type");
        }

        // case when user just defined object itself.
        return object.containsKey(o2);
    }
}
