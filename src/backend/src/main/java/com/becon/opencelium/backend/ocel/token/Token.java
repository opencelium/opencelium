package com.becon.opencelium.backend.ocel.token;

import java.util.List;

public class Token {
    private final String lexeme;
    private final TokenType type;
    private List<List<Token>> functionParameters;

    private static final Token OPEN_BRACE = Token.of(null, TokenType.OPEN_PARENTHESES);
    private static final Token CLOSE_BRACE = Token.of(null, TokenType.CLOSE_PARENTHESES);

    private Token(String lexeme, TokenType type, List<List<Token>> functionParameters) {
        this.lexeme = lexeme;
        this.type = type;
        this.functionParameters = functionParameters;
    }

    public static Token of(String lexeme, TokenType tokenType) {
        return of(lexeme, tokenType, null);
    }

    public static Token of(String lexeme, TokenType tokenType, List<List<Token>> functionParameters) {
        return new Token(lexeme, tokenType, functionParameters);
    }

    public static Token openBrace() {
        return OPEN_BRACE;
    }

    public static Token closeBrace() {
        return CLOSE_BRACE;
    }

    public String getLexeme() {
        return lexeme;
    }

    public TokenType getType() {
        return type;
    }

    public List<List<Token>> getFunctionParameters() {
        return functionParameters;
    }

    public void setFunctionParameters(List<List<Token>> functionParameters) {
        this.functionParameters = functionParameters;
    }
}
