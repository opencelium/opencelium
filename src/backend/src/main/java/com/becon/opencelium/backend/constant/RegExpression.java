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
    String directRef = "#[a-zA-Z0-9]{6}\\.(\\(response\\)|\\(request\\))\\..+";
    String wrappedDirectRef = "\\{%#[a-zA-Z0-9]{6}\\.(\\(response\\)|\\(request\\))\\..+\\%}";
    String responseListDirectRef = "#[a-zA-Z0-9]{6}\\.(response)\\[\\*\\].*";
    String responseListWrappedDirectRef = "\\{%#[a-zA-Z0-9]{6}\\.(response)\\[\\*\\].*%}";
    String enhancement = "#\\{%[0-9a-fA-F]{24}%\\}";
    String requestData = "\\{(.*?)\\}";
    String pageRef = "@\\{([^}]+)\\}";
}
