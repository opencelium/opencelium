package com.becon.opencelium.backend.api.serviceportal;

import com.becon.opencelium.backend.api.module.*;

/**
 * Defines the set of features (modules) exposed by the Service Portal API.
 *
 * <p>Each module corresponds to a functional area of the Service Portal,
 * and provides its own operations.</p>
 */
public interface ServicePortal {
    /**
     * Provides access to the Invoker module.
     *
     * @return the {@link InvokerModule} for executing remote API invocations
     */
    InvokerModule invoker();

    /**
     * Provides access to the Subscription module.
     *
     * @return the {@link SubscriptionModule} for managing subscriptions
     */
    SubscriptionModule subscription();

    /**
     * Provides access to the Report module.
     *
     * @return the {@link ReportModule} for retrieving operation usage reports
     */
    ReportModule operationUsage();

    /**
     * Provides access to the Template module.
     *
     * @return the {@link TemplateModule} for managing templates
     */
    TemplateModule template();
}
