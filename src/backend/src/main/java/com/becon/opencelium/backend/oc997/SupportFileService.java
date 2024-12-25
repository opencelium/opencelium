package com.becon.opencelium.backend.oc997;

import java.io.File;
import java.util.List;

public interface SupportFileService {
    List<ConnectionSupportFiles> supportFileList();
    ConnectionSupportFiles connectionSupportFileList(Long connectionId);
    File getSupportFile(Long connectionId, String zipFileName);
    File getSupportFile(Long connectionId);
}
