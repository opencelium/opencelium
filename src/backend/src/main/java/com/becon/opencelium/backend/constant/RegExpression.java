package com.becon.opencelium.backend.constant;

public interface RegExpression {
    // Invoker
    String requiredData = "\\{(.*?)\\}";

    // Reference
    String directRef = "#[a-zA-Z0-9]{6}\\.(\\(response\\)|\\(request\\))\\..+";
    String wrappedDirectRef = "\\{%#[a-zA-Z0-9]{6}\\.(\\(response\\)|\\(request\\))\\..+\\%}";
    String enhancement = "#\\{%[0-9a-fA-F]{24}%\\}";
    String webhook = "\\$\\{(.*?)\\}";
    String pageRef = "@\\{([^}]+)\\}";
    String requestData = "\\{(?!%)(.*?)(?<!%)\\}";

    // Another one
    String arrayWithLetterIndex = "\\[([a-z,*]+)\\]";
    String array = "\\[.*\\]";
    String referencePath = "(body\\.\\$\\..+)|(header\\.\\$\\..+)|(path)";
    String TEST_CONNECTION_REGEX = "^!\\*test_connection_\\d+_.+";
}