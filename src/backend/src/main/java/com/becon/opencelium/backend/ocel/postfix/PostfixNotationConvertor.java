package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.utils.OperatorUtils;
import com.becon.opencelium.backend.ocel.token.Token;
import com.becon.opencelium.backend.ocel.token.TokenType;

import java.util.*;

class PostfixNotationConvertor {

    private static final PostfixNotationConvertor INSTANCE = new PostfixNotationConvertor();

    private PostfixNotationConvertor() {
    }

    public Queue<Token> toPostfix(List<Token> tokens) {
        Queue<Token> output = new LinkedList<>();
        Stack<Token> operators = new Stack<>();

        for (Token token : tokens) {
            switch (token.getType()) {
                case OPEN_PARENTHESES -> operators.push(token);
                case CLOSE_PARENTHESES -> {
                    while (!operators.empty()) {
                        Token top = operators.pop();
                        if (top.getType() != TokenType.OPERATOR) {
                            break;
                        } else {
                            output.add(top);
                        }
                    }
                }
                case OPERATOR -> {
                    Operator operator = OperatorUtils.getOperator(token.getLexeme());
                    while (!operators.empty()) {
                        Token top = operators.peek();
                        if (top.getType() == TokenType.OPERATOR) {
                            Operator topOperator = OperatorUtils.getOperator(top.getLexeme());
                            if (topOperator.getPrecedence() >= operator.getPrecedence()) {
                                operators.pop();
                                output.add(top);
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    operators.push(token);
                }
                case OPERAND -> output.add(token);
                case FUNCTION -> {
                    List<List<Token>> parameters = token.getFunctionParameters();
                    List<List<Token>> reOrderedParams = new ArrayList<>(parameters.size());
                    for (List<Token> parameter : parameters) {
                        Queue<Token> postfixParams = toPostfix(parameter);
                        reOrderedParams.add(new ArrayList<>(postfixParams));
                    }
                    token.setFunctionParameters(reOrderedParams);
                    output.add(token);
                }
            }
        }
        while (!operators.empty())
            output.add(operators.pop());
        return output;
    }

    public static PostfixNotationConvertor getInstance() {
        return INSTANCE;
    }
}
