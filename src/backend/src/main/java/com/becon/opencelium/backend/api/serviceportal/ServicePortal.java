package com.becon.opencelium.backend.api.serviceportal;

import com.becon.opencelium.backend.api.module.*;

public interface ServicePortal {
    InvokerModule invoker();
    SubscriptionModule subscription();
    ReportModule operationUsage();
    TemplateModule template();
}
