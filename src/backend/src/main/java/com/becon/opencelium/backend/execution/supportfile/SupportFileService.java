package com.becon.opencelium.backend.execution.supportfile;

import java.io.File;
import java.util.List;

public interface SupportFileService {
    List<SupportFile> supportFileList();
    List<SupportFile> connectionSupportFileList(Long connectionId);
    File getSupportFile(Long connectionId, String zipFileName);
    File getSupportFile(Long connectionId);
    void deleteSupportFile(String zipFileName);
}
