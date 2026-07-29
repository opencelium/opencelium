package com.becon.opencelium.backend.constant;

public interface AppYamlPath {
    String OC_VERSION = "opencelium.version";
    String CONNECTOR_SECRET_KEY = "opencelium.connector.security.key";
    String MASTER_PASSWORD = "opencelium.connector.master-password";
    String PROXY_HOST = "opencelium.rest-template.proxy.host";
    String PROXY_PORT = "opencelium.rest-template.proxy.port";
    String PROXY_USER = "opencelium.rest-template.proxy.username";
    String PROXY_PASS = "opencelium.rest-template.proxy.password";
    String INCOMING_WEBHOOK = "opencelium.notification.tools.incoming-webhook.url";
    String INSTALLATION = "opencelium.installation";

    String TOKEN_EXPIRE_TIME = "opencelium.token.expiration-time";
    String TOKEN_ACTIVITY_TIME = "opencelium.token.activity-time";
    String TOKEN_SECRET = "opencelium.token.secret";

    //Service portal variables;
    String SP_BASE_URL = "opencelium.service-portal.base-url";
    String SP_TOKEN = "opencelium.service-portal.token";

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

    // Support file variables:
    // Default base directory is 'src/main/resources/support-files'
    String SUPPORT_FILE_BASE_DIRECTORY = "opencelium.support.file.directory";

    // Default support (*.zip) files limit for successful execution per connection is 1
    String SUPPORT_FILE_SUCCESS_LIMIT = "opencelium.support.file.limit.success";

    // Default support (*.zip) files limit for failed execution per connection is 5
    String SUPPORT_FILE_FAIL_LIMIT = "opencelium.support.file.limit.fail";

    // Log file variables:
    // Default log (*.log) files limit for successful execution per connection is 2
    String LOG_FILE_SUCCESS_LIMIT = "opencelium.log.retention.per-connection.success";

    // Default log (*.log) files limit for failed execution per connection is 3
    String LOG_FILE_FAIL_LIMIT = "opencelium.log.retention.per-connection.fail";

    // Connector health monitor variables:
    // Master switch for the periodic background health sweep. Default: true
    String CONNECTOR_HEALTH_ENABLED = "opencelium.connector-health.enabled";

    // Delay between two sweeps in milliseconds. Default: 300000 (5 minutes)
    String CONNECTOR_HEALTH_INTERVAL = "opencelium.connector-health.interval";

    // Delay before the first sweep after startup in milliseconds. Default: 60000
    String CONNECTOR_HEALTH_INITIAL_DELAY = "opencelium.connector-health.initial-delay";

    // Consecutive failed checks before a connector's status transitions to
    // DOWN/AUTH_FAILED (flap damping). Recovery to UP needs a single success. Default: 3
    String CONNECTOR_HEALTH_FAILURE_THRESHOLD = "opencelium.connector-health.failure-threshold";

    // How many connectors are checked concurrently by the monitor. Default: 4
    String CONNECTOR_HEALTH_PARALLELISM = "opencelium.connector-health.parallelism";
}
