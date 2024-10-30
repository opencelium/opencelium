package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.commons.Token;

public interface Operator extends Token {
    Object apply(Object o1, Object o2) throws ApplyOperatorException;

    Object apply(Object o) throws ApplyOperatorException;

    Arity getArity();

    int getPrecedence();

    boolean isLeftSided();

    boolean applicable(String left, String right);

    boolean applicable(String val);
}