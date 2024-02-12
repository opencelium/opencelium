package com.becon.opencelium.backend.constant;

public interface YamlPropConst {
    String OC_VERSION = "opencelium.version";
    String CONNECTOR_SECRET_KEY = "opencelium.connector.security.key";
    String PROXY_HOST = "opencelium.rest_template.proxy.host";
    String PROXY_PORT = "opencelium.rest_template.proxy.port";
    String PROXY_USER = "opencelium.rest_template.proxy.username";
    String PROXY_PASS = "opencelium.rest_template.proxy.password";

    // Indicates that the gc is enabled or not. Default: true
    String GC_CONNECTION_IS_ON = "opencelium.gc.connection.isOn";

    // Indicates a strategy of the trigger. It must be cron, periodic or on-restart.
    // Default strategy is 'periodic'
    String GC_CONNECTION_STRATEGY = "opencelium.gc.connection.strategy";

    // a cron expression for the trigger if the strategy is 'cron'.
    // Default cron expression is '0 0/1 * * * ?': fires every 1 minute
    String GC_CONNECTION_CRON = "opencelium.gc.connection.cron";

    // a delay for the trigger if the strategy is 'periodic'
    // Default delay is 100 seconds. It means gc runs every 100 seconds
    String GC_CONNECTION_FIXED_DELAY = "opencelium.gc.connection.fixedDelay";

    // an initial delay for the trigger if the strategy is 'periodic'
    // Default initial delay is 100 seconds. This means the gc starts to run after 100 seconds from application is ready
    String GC_CONNECTION_INITIAL_DELAY = "opencelium.gc.connection.initialDelay";
}
