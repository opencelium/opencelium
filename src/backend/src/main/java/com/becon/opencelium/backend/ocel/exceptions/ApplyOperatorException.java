package com.becon.opencelium.backend.ocel.exceptions;

import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;

public class ApplyOperatorException extends Exception {
    private final ErrorCode code;
    private final OperatorEnum operator;
    private final Object o1;
    private final Object o2;
    private final Arity arity;

    public ApplyOperatorException(ErrorCode code, OperatorEnum operator, Object o1, Object o2) {
        this(code, operator, o1, o2, Arity.BINARY);
    }

    public ApplyOperatorException(ErrorCode code, OperatorEnum operator, Object o1, Object o2, Arity arity) {
        this.code = code;
        this.operator = operator;
        this.o1 = o1;
        this.o2 = o2;
        this.arity = arity;
    }

    public static ApplyOperatorException invalidTypePairsException(OperatorEnum operator, Object o1, Object o2) {
        return new ApplyOperatorException(ErrorCode.AO_INVALID_OPERAND_PAIRS, operator, o1, o2);
    }

    public static ApplyOperatorException invalidTypeException(OperatorEnum operator, Object o) {
        return new ApplyOperatorException(ErrorCode.AO_INVALID_TYPE, operator, o, null, Arity.UNARY);
    }

    public static ApplyOperatorException invalidOperandValueException(OperatorEnum operator, Object o1, Object o2) {
        return invalidOperandValueException(operator, o1, o2, Arity.BINARY);
    }

    public static ApplyOperatorException invalidOperandValueException(OperatorEnum operator, Object o1, Object o2, Arity arity) {
        return new ApplyOperatorException(ErrorCode.AO_INVALID_OPERAND_VALUE, operator, o1, o2, arity);
    }

    public String getMessage() {
        return switch (this.code) {
            case AO_INVALID_OPERAND_PAIRS -> "'%s' operator doesn't support these type pairs. 1-type - '%s', 2-type - '%s'"
                    .formatted(this.operator.getName(),
                            this.o1 == null ? null : this.o1.getClass(),
                            this.o2 == null ? null : this.o2.getClass());
            case AO_INVALID_OPERAND_VALUE -> this.arity == Arity.UNARY
                    ? "'%s' operator doesn't support this value - '%s'".formatted(this.operator, this.o1)
                    : "'%s' operator doesn't support these value pairs. 1-value - '%s', 2-value - '%s'"
                    .formatted(this.operator, this.o1, this.o2);
            case AO_INVALID_TYPE -> "'%s' operator doesn't support this type: '%s'"
                    .formatted(this.operator, this.o1 == null ? null : this.o1.getClass());
            default -> this.getMessage();
        };
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

    public String getCodeString() {
        return code.getCode();
    }
    public ErrorCode getCode() {
        return code;
    }

    public Arity getArity() {
        return arity;
    }
}
