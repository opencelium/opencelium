package com.becon.opencelium.backend.exception;

/**
 * Thrown when a run reads a global variable its snapshot does not hold: the variable does not
 * exist, or the workflow is outside its scope. The run fails with this error; the reference is
 * never replaced with an empty value.
 */
public class GlobalVariableNotFoundException extends RuntimeException {

    private final String name;

    public GlobalVariableNotFoundException(String name) {
        this(name, "Global variable '%s' does not exist or this workflow is outside its scope".formatted(name));
    }

    private GlobalVariableNotFoundException(String name, String message) {
        super(message);
        this.name = name;
    }

    /**
     * The error of a connector that reads a variable some workflows cannot use. A connector is
     * shared by workflows of any category, so it only reads variables open to all of them.
     */
    public static GlobalVariableNotFoundException notOpenToAll(String name) {
        return new GlobalVariableNotFoundException(name,
                "Global variable '%s' is not open to all workflows, so a connector cannot use it".formatted(name));
    }

    /** Name of the variable that was not found. */
    public String getName() {
        return name;
    }
}
