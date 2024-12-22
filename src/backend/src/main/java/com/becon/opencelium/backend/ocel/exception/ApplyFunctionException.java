package com.becon.opencelium.backend.ocel.exception;

import com.becon.opencelium.backend.ocel.function.FunctionEnum;
import org.apache.commons.lang3.StringUtils;

public class ApplyFunctionException extends Exception {
    private final ErrorCode code;

    public ApplyFunctionException(ErrorCode code, String message) {
        this.code = code;
    }

    public static ApplyFunctionException invalidParamList(FunctionEnum functionEnum, Object[] args) {
        return new ApplyFunctionException(ErrorCode.FUNC_INVALID_PARAM_LIST, StringUtils.join(args) + " - parameter list is not compatible for '%s' function".formatted(functionEnum.name()));
    }

    public static ApplyFunctionException invalidParameterValue(FunctionEnum functionEnum, String var, int index, String message) {
        return new ApplyFunctionException(ErrorCode.FUNC_INVALID_PARAMETER, "%d-parameter, '%s', is invalid for %s function : %s".formatted(index, var, functionEnum.getName(), message));
    }

    public ErrorCode getCode() {
        return code;
    }
}
