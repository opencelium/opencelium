package com.becon.opencelium.backend.execution.statement.operator;

import java.util.ArrayList;

public class ContainsInList implements Operator {

    @Override
    public <T, S> boolean compare(T val1, S val2) {
        ArrayList values = (ArrayList) val2;
        return values.contains(val1);
    }
}
