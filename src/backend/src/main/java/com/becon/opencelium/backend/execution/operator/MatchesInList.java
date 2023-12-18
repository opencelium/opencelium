package com.becon.opencelium.backend.execution.operator;

import java.util.Arrays;

public class MatchesInList implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        String[] values = (String[]) o2;
        Like like = new Like();

        return Arrays.stream(values).anyMatch(v -> like.apply(o1, v));
    }
}
