package com.becon.opencelium.backend.resource.updateassistant;

import com.becon.opencelium.backend.utility.PackageVersionManager;

public class JarFileDescriptor {
    private String version;

    private String fileName;

    private String location;

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public JarFileDescriptor(String location, String fileName) {
        this.location = location;
        this.fileName = fileName;
        this.version = PackageVersionManager.extractVersionOfJarFile(fileName);
    }
}
