package com.becon.opencelium.backend.constant;

/**
 * This saves all error messages
 */
public interface ExceptionMessages {
    String MASTER_PASSWORD_REQUIRED = "%s is required to access this endpoint".formatted(HeaderConstants.MASTER_PASSWORD);
    String REQUIRED_DAT_NOT_FOUND = "'%s' required data not found in invoker";
    String MASTER_PASSWORD_IS_MISSING_IN_HEADER = "master_password is missing or empty";
    String MASTER_PASSWORD_NOT_EXIST = "Please set the master password in the application.yml file, to show this information";
    String MASTER_PASSWORD_WRONG = "Invalid master password";
}
