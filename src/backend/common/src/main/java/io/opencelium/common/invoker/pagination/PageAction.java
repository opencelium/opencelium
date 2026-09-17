package io.opencelium.common.invoker.pagination;

import java.util.Arrays;

/** What to do with a pagination parameter between one page request and the next. */
public enum PageAction {

    /** Take the parameter's value from the response. */
    READ("read"),

    /** Send the parameter's value with each request. */
    WRITE("write"),

    /** Send the parameter's value, then advance it for the next request. */
    INCREMENT("increment"),

    /** Gather the parameter's contents from every page into one result. */
    COLLECT("collect"),

    /** Follow the parameter, typically a link, to obtain the next page. */
    FETCH("fetch");

    private final String value;

    PageAction(String value) {
        this.value = value;
    }

    /** The name used in an invoker file's {@code action} attribute, for example {@code increment}. */
    public String value() {
        return value;
    }

    /**
     * Resolves an action from its name in an invoker file, ignoring case.
     *
     * @throws IllegalArgumentException if the name is not a pagination action
     */
    public static PageAction fromValue(String value) {
        return Arrays.stream(values())
                .filter(action -> action.value.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("'" + value + "' is not a pagination action; "
                        + "expected one of " + Arrays.stream(values()).map(PageAction::value).toList()));
    }
}
