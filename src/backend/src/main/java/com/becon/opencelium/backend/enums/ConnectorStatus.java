package com.becon.opencelium.backend.enums;

/**
 * Health status of a connector's remote API, as determined by the last communication check.
 */
public enum ConnectorStatus {

    /** The remote API answered the test request successfully. */
    UP,

    /** The remote API is reachable but rejected the configured credentials. */
    AUTH_FAILED,

    /** The remote API could not be reached or the request failed. */
    DOWN,

    /** The connector has never been checked. */
    UNKNOWN
}
