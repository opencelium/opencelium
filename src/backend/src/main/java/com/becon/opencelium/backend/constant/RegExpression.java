package com.becon.opencelium.backend.constant;

public interface RegExpression {
    // Invoker
    String requiredData = "\\{(.*?)\\}";
    String responsePointer = "\\{%(.*?)%\\}";

    // Another one
    String arrayWithLetterIndex = "\\(([^)]*)\\)";
    String arrayWithNumberIndex = "\\[([0-9]+)\\]";
    String wholeArray = "\\[([*]){1}\\]";
}
