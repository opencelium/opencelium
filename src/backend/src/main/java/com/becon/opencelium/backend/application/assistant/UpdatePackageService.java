package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;

import java.util.List;

public interface UpdatePackageService {

    List<AvailableUpdate> getOffVersions();
    List<AvailableUpdate> getOnVersions();
    AvailableUpdate getOffVersionByDir(String dir) throws Exception;
    String[] getDirectories();
    AvailableUpdateResource toResource(AvailableUpdate offVersions);
}
