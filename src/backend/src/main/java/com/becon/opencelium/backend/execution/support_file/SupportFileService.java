package com.becon.opencelium.backend.execution.support_file;

import java.io.File;
import java.util.List;

public interface SupportFileService {
    List<SupportFile> supportFileList();
    List<SupportFile> connectionSupportFileList(Long connectionId);
    File getSupportFile(Long connectionId, String zipFileName);
    File getSupportFile(Long connectionId);
    void collectFiles(Long connectionId, long executionId, String timestamp, String type);
    void deleteSupportFile(String zipFileName);
}
