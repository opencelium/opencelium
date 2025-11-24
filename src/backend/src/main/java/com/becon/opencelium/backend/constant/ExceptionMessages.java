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
    String CONNECTION_EXIST_WITH_TITLE = "Connection exist with title: '%s'";
    String CATEGORY_NOT_FOUND = "Category not found";
}
