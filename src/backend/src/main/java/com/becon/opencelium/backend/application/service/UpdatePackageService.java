package com.becon.opencelium.backend.application.service;

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;

import java.util.List;

public interface UpdatePackageService {

    List<AvailableUpdate> getOffVersions();
    List<AvailableUpdate> getOnVersions();

    String[] getDirectories();
    AvailableUpdateResource toResource(AvailableUpdate offVersions);
}
