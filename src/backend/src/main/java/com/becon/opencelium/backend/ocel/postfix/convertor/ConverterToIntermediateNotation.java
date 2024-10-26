package com.becon.opencelium.backend.ocel.postfix.convertor;

import com.becon.opencelium.backend.ocel.commons.Operand;
import com.becon.opencelium.backend.ocel.commons.Token;
import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.operators.Operator;
import com.becon.opencelium.backend.ocel.utils.Utils;

import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Stack;

public class ConverterToIntermediateNotation {
    public static Queue<Token> convert(String expression) throws InvalidExpressionException {
        List<String> stringTokens = Utils.splitBySpace(expression);
        return intermediateNotation(stringTokens);
    }

    private static Queue<Token> intermediateNotation(List<String> stringTokens) throws InvalidExpressionException {
        Queue<Token> output = new LinkedList<>();
        Stack<Object> operators = new Stack<>();

        for (String token : stringTokens) {
            if (token.equals("(")) {
                operators.push(token);
            } else if (token.equals(")")) {
                while (!operators.empty()) {
                    Object top = operators.pop();
                    if (top instanceof String) {
                        break;
                    } else {
                        output.add((Operator) top);
                    }
                }
            } else if (Utils.isOperator(token)) {
                Operator operator = Utils.getOperator(token);
                while (!operators.empty()) {
                    Object top = operators.peek();
                    if (top instanceof Operator opr) {
                        if (opr.getPrecedence() >= operator.getPrecedence()) {
                            operators.pop();
                            output.add(opr);
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                operators.push(operator);
            } else {
                output.add(Operand.withRawValue(token));
            }
        }
        while (!operators.empty())
            output.add((Operator) operators.pop());
        return output;
    }
}
