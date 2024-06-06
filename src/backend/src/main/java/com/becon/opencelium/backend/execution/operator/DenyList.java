package com.becon.opencelium.backend.execution.operator;

public class DenyList implements Operator{

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        return !(new MatchesInList().apply(o1, o2));
    }
}
