package com.becon.opencelium.backend.execution.operator;

import java.util.Arrays;

public class MatchesInList implements Operator {

    // incoming values: o1 - String; o2 - %var1%, %var2, var3%
    @Override
    public <T, S> boolean apply(T o1, S o2) {
        String[] values = o2.toString().replace("\n", ",").split(",");
//        String[] values = (String[]) o2;
        Like like = new Like();

        return Arrays.stream(values).anyMatch(v -> like.apply(o1, v));
    }
}
