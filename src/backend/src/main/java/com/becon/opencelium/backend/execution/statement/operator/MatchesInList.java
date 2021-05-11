package com.becon.opencelium.backend.execution.statement.operator;

import java.util.Arrays;
import java.util.List;

public class MatchesInList implements Operator {

    @Override
    public <T, S> boolean compare(T val1, S val2) {
        String[] values = (String[])val2;
        Like like = new Like();
        for (Object v : values) {
            if (like.compare(val1, v)) {
                return true;
            }
        }
        return false;
    }
}
