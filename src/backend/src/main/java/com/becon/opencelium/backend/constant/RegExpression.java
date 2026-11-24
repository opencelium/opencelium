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

    /**
     * Global variable: {@code {{global.name}}}, optionally followed by a path into an array or a
     * map, e.g. {@code {{global.limits.maxPerPage}}} or {@code {{global.tenants[0].id}}}. Group 1
     * is the variable name, group 2 the path.
     *
     * <p>A token escaped with a backslash, {@code \{{global.name}}}, is literal text and is not
     * matched. Wherever references are parsed this pattern is checked before {@link #requestData}
     * and {@link #requiredData}, which would otherwise read a part of the token as request data.
     */
    String globalRef = "(?<!\\\\)\\{\\{global\\.([A-Za-z][A-Za-z0-9_]*)([.\\[][^{}]*)?\\}\\}";

    /**
     * An escaped global variable token, {@code \{{global.name}}}: literal text that is sent as
     * {@code {{global.name}}} and is never resolved.
     */
    /**
     * The target of a global variable write in a method's {@code globalWrites}: {@code
     * global.name}, without braces and without a path, because a write replaces the whole value.
     * Group 1 is the variable name.
     */
    String globalWriteTarget = "global\\.([A-Za-z][A-Za-z0-9_]*)";

    String escapedGlobalRef = "\\\\\\{\\{global\\.[A-Za-z][A-Za-z0-9_]*(?:[.\\[][^{}]*)?\\}\\}";

    // never starts on '{{', so it cannot take the opening of a global variable reference
    String requestData = "\\{(?![%{])(.*?)(?<!%)\\}";

    // Another one
    String arrayWithLetterIndex = "\\[([a-z,*]+)\\]";
    String array = "\\[.*\\]";
    String referencePath = "(body\\.\\$\\..+)|(header\\.\\$\\..+)|(path)";
    String TEST_CONNECTION_REGEX = "^!\\*test_connection_\\d+_.+";
    String TEST_SCHEDULE_REGEX = "^!\\*test_schedule_\\d+_.+";
}