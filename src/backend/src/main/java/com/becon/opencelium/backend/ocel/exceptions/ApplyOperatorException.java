package com.becon.opencelium.backend.ocel.exceptions;

import com.becon.opencelium.backend.ocel.enums.OperatorEnum;

public class ApplyOperatorException extends Exception {
    private final ErrorCode code;
    private final OperatorEnum operator;
    private final Object o1;
    private final Object o2;

    public ApplyOperatorException(ErrorCode code, OperatorEnum operator, Object o1, Object o2) {
        this.code = code;
        this.operator = operator;
        this.o1 = o1;
        this.o2 = o2;
    }

    public static ApplyOperatorException invalidTypePairs(OperatorEnum operator, Object o1, Object o2) {
        return new ApplyOperatorException(ErrorCode.INVALID_TYPE_PAIRS, operator, o1, o2);
    }

    public static ApplyOperatorException invalidTypeException(OperatorEnum operator, Object o) {
        return new ApplyOperatorException(ErrorCode.INVALID_TYPE, operator, o, null);
    }

    public static ApplyOperatorException unknownException(OperatorEnum operator, Object o1, Object o2) {
        return new ApplyOperatorException(ErrorCode.UNKNOWN_EXCEPTION, operator, o1, o2);
    }

    public OperatorEnum getOperator() {
        return operator;
    }

    public Object getO1() {
        return o1;
    }

    public Object getO2() {
        return o2;
    }

    public ErrorCode getCode() {
        return code;
    }
}
