package com.becon.opencelium.backend.resource;

import com.becon.opencelium.backend.configuration.OidcProperties;

import java.util.List;

/**
 * Read-only view of the OIDC configuration for the admin panel. The client secret is never
 * exposed - only whether one is configured.
 */
public record OidcConfigDTO(boolean enabled, String displayName, String issuerUri, String clientId,
                            boolean clientSecretConfigured, List<String> scopes, String redirectUri,
                            String frontendRedirectUri, String userInfoUri, String emailClaim, String groupClaim,
                            String defaultRole, boolean jitProvisioning,
                            List<OidcProperties.Group2Role> groupRoleMapping) {
}
