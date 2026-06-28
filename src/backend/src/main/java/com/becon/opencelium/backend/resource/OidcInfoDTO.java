package com.becon.opencelium.backend.resource;

import jakarta.annotation.Resource;

/**
 * Public (unauthenticated) OIDC status used by the login page to decide whether to render the
 * "Sign in with SSO" button. Contains no secrets.
 */
@Resource
public class OidcInfoDTO {
    private boolean enabled;
    private String buttonText;

    public OidcInfoDTO() {
    }

    public OidcInfoDTO(boolean enabled, String buttonText) {
        this.enabled = enabled;
        this.buttonText = buttonText;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getButtonText() {
        return buttonText;
    }

    public void setButtonText(String buttonText) {
        this.buttonText = buttonText;
    }
}
