package com.becon.opencelium.backend.constant;

public interface RegExpression {
    // Invoker
    String requiredData = "\\{(.*?)\\}";
    String responsePointer = "\\{%(.*?)%\\}";

    // Another one
    String arrayWithLetterIndex = "\\[([a-z,*]+)\\]";
    String arrayWithNumberIndex = "\\[([0-9]+)\\]";
    String wholeArray = "\\[([*]){1}\\]";
    String isNumber = "^[+-]?\\d+(\\.\\d+)?$";
    String webhook = "\\$\\{(.*?)\\}";
    String queryParams = "\\$\\{(.*?)\\}";
    String hasEnh = "#(([a-zA-Z0-9]+).\\(response\\)|([a-zA-Z0-9]+).\\(request\\))";
//    String directRef = "#(([a-zA-Z0-9]+).\\(response\\)|([a-zA-Z0-9]+).\\(request\\))";
    String directRef = "#[a-zA-Z0-9]{6}\\.(\\(response\\)|\\(request\\))\\..+";
    String enhancement = "#\\{%(.*?)%\\}";
}
