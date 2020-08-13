package com.becon.opencelium.backend.constant;

public interface RegExpression {
    // Invoker
    String requiredData = "\\{(.*?)\\}";
    String responsePointer = "\\{%(.*?)%\\}";

    // Another one
    String arrayWithIndex = "\\(([^)]*)\\)";
    String wholeArray = "\\[([*]){1}\\]";
}
