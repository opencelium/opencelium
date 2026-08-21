package com.becon.opencelium.backend.constant;

public interface RegExpression {
    // Invoker
    String requiredData = "\\{(.*?)\\}";

    /**
     * Invoker name policy: letters, digits, spaces, '-', '_', '(' and ')'.
     * A dot is allowed only inside the name: it can neither open nor close the
     * name and two dots may not follow each other.
     */
    String INVOKER_NAME_REGEX = "[\\p{L}\\p{N} _()\\-]+(?:\\.[\\p{L}\\p{N} _()\\-]+)*";

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
    String TEST_SCHEDULE_REGEX = "^!\\*test_schedule_\\d+_.+";
}