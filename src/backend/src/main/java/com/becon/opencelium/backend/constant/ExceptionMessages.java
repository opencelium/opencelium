package com.becon.opencelium.backend.constant;

/**
 * This saves all error messages
 */
public interface ExceptionMessages {
    String REQUIRED_DATA_NOT_FOUND = "'%s' required data not found";
    String MASTER_PASSWORD_IS_MISSING_IN_HEADER = "master_password is missing or empty";
    String MASTER_PASSWORD_WRONG = "Invalid master password";
    String LOG_NOT_FOUND = "Log not found for execution: %d";
    String UNKNOWN_ERROR = "Unknown error";
    String INVALID_LOOP_INDEX = "loopIndex is not valid : %s";
    String LOG_ELEMENT_NOT_FOUND_WITH_INDEX_PATH = "Log element not found with indexPath: %s";
    String LOOP_INDEX_IS_REQUIRED = "loopIndex is required";
    String TITLE_HAS_ALREADY_TAKEN = "'%s' title has already been taken";
    String CONNECTOR_NOT_FOUND = "Connector[id=%s] is not found";
    String CONNECTION_NOT_FOUND = "Connection[id=%s] is not found";
    String CATEGORY_NOT_FOUND = "Category[id=%s] is not found";
    String INVALID_NAME = "Invalid name: %s";
    String CYCLE_FOUND = "Cycle detected: %s";
    String CONNECTION_ALREADY_EXISTS = "Connection[id=%s] already exists";
    String INVALID_REFERENCE = "Invalid reference: %s";
    String METHOD_NOT_FOUND = "Method[id=%s] is not found";
    String OPERATOR_NOT_FOUND = "Operator[id=%s] is not found";
    String ENHANCEMENT_NOT_FOUND = "Enhancement[id=%s] is not found";
}
