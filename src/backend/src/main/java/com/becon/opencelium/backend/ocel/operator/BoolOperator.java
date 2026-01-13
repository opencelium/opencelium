package com.becon.opencelium.backend.ocel.operator;

import java.util.function.Supplier;

public interface BoolOperator {
    Boolean apply(Supplier<Boolean> x, Supplier<Boolean> y);
}
