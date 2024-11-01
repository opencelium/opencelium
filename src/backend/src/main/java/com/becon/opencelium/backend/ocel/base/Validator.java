package com.becon.opencelium.backend.ocel.base;

import com.becon.opencelium.backend.ocel.exceptions.InvalidSyntaxException;

public interface Validator {
    String validateAndStandardize(String expression) throws InvalidSyntaxException;
}
