package com.becon.opencelium.backend.commons;

import org.springframework.http.HttpHeaders;

/**
 * A simple data holder for file-related metadata and content.
 * This class encapsulates the raw binary data of a file along with its
 * file name and content type (MIME type).
 */
public class FileDescriptor {

    private byte[] data;
    private String fileName;
    private String contentType;

    public static FileDescriptor of(byte[] data, String fileName, String contentType) {
        FileDescriptor fd = new FileDescriptor();
        fd.data = data;
        fd.fileName = fileName;
        fd.contentType = contentType;
        return fd;
    }

    public HttpHeaders buildHeaders() {
        HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=%s".formatted(getFileName()));
        headers.add(HttpHeaders.CONTENT_TYPE, getContentType());
        return headers;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
