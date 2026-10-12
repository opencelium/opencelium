package com.becon.opencelium.backend.resource.connector;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of installing invoker files from the remote repository: the metadata of the invokers
 * that were installed and the files that were rejected, with the reason for each.
 */
public class InvokerBulkInstallDTO {

    private List<InvokerDTO> installed = new ArrayList<>();
    private List<FailedFileDTO> failed = new ArrayList<>();

    public InvokerBulkInstallDTO() {
    }

    public InvokerBulkInstallDTO(List<InvokerDTO> installed, List<FailedFileDTO> failed) {
        this.installed = installed;
        this.failed = failed;
    }

    public List<InvokerDTO> getInstalled() {
        return installed;
    }

    public void setInstalled(List<InvokerDTO> installed) {
        this.installed = installed;
    }

    public List<FailedFileDTO> getFailed() {
        return failed;
    }

    public void setFailed(List<FailedFileDTO> failed) {
        this.failed = failed;
    }

    public static class FailedFileDTO {

        private String fileName;
        private String reason;

        public FailedFileDTO() {
        }

        public FailedFileDTO(String fileName, String reason) {
            this.fileName = fileName;
            this.reason = reason;
        }

        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
