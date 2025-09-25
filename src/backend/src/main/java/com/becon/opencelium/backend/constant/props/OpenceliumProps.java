package com.becon.opencelium.backend.constant.props;

import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "opencelium")
public class OpenceliumProps {

    private String version;

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Integer majorVersion() {
        if (StringUtils.isBlank(version)) {
            return null;
        }

        int firstDotIndex = version.indexOf(".");
        if (firstDotIndex == -1) {
            return null;
        }

        try {
            return Integer.parseInt(version.substring(0, firstDotIndex));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
