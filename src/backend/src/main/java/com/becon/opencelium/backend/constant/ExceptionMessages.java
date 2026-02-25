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
    String CANT_REMOVE_LAST_VERSION_CONNECTION = "Can't remove last version connection";
    String ONLY_OWNER_CAN_PERFORM_ACTION = "Only owner can perform this action";
    String ONLY_OWNER_OR_ADMIN_CAN_PERFORM_ACTION = "Only owner or admin can perform this action";
}
