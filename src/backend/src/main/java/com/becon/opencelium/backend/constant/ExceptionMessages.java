package com.becon.opencelium.backend.constant;

/**
 * This saves all error messages
 */
public interface ExceptionMessages {
    String MASTER_PASSWORD_REQUIRED = "%s is required to access this endpoint".formatted(HeaderConstants.MASTER_PASSWORD);
    String REQUIRED_DAT_NOT_FOUND = "'%s' required data not found in invoker";
}
