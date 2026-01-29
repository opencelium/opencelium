package com.becon.opencelium.backend.ocel.function;

import com.becon.opencelium.backend.ocel.Component;
import com.becon.opencelium.backend.ocel.exception.ApplyFunctionException;

public interface Function extends Component {
    Object call(Object[] args) throws ApplyFunctionException;

    boolean parameterListMatches(Object[] args);

    FunctionEnum getFunctionEnum();
}