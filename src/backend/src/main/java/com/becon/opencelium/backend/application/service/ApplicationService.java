package com.becon.opencelium.backend.application.service;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import org.springframework.stereotype.Service;

public interface ApplicationService {

    SystemOverview getSystemOverview();
    SystemOverviewResource toResource(SystemOverview systemOverview);
}
