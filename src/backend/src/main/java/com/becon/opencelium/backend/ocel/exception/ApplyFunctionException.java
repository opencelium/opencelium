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

    public ErrorCode getCode() {
        return code;
    }
}
