package com.becon.opencelium.backend.configuration;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@ConfigurationProperties(prefix = "spring.security.oidc")
public class OidcProperties {

    public static final String REGISTRATION_ID = "opencelium";

    private boolean enabled = false;
    private String displayName = "OpenID Connect";
    private String issuerUri;
    private String clientId;
    private String clientSecret;
    private List<String> scopes = new ArrayList<>(List.of("openid", "profile", "email"));
    private String redirectUri;
    private String frontendRedirectUri;
    private String authorizationUri;
    private String tokenUri;
    private String jwkSetUri;
    private String userInfoUri;
    private String emailClaim = "email";
    private String groupClaim = "groups";
    private String defaultRole;
    private boolean jitProvisioning = true;
    /**
     * Requires the identity provider to confirm the 'email_verified' claim. The email decides which
     * account a login lands on - it becomes the username of a provisioned account and it is the
     * fallback link of the weak matching mode - so an unconfirmed address must not be trusted.
     */
    private boolean requireVerifiedEmail = true;
    /**
     * Opt-in fallback for identity provider migrations, where a moved account keeps its email but
     * gets a new subject: an existing account with the same email is then used and re-linked to the
     * identity that just reported it. Off by default, because it lets an identity provider take over
     * an account by claiming its email address. The account is only ever found by email while this
     * is on and while the email is verified.
     */
    private boolean weakMatching = false;
    private List<Group2Role> groupRoleMapping = new ArrayList<>();
    private int timeout = 10000; // in milliseconds
    private int stateActivityTime = 300; // in seconds, lifetime of the authorization request
    private int ticketActivityTime = 60; // in seconds, one-time ticket lifetime
    @Value("${logging.level.org.springframework.security.oauth2:OFF}")
    private String showLogs;

    public String getRoleByGroup(String group) {
        return groupRoleMapping.stream()
                .filter(mapping -> Objects.equals(group, mapping.group))
                .map(Group2Role::getOcRole)
                .findFirst()
                .orElseThrow();
    }

    /**
     * Fails the startup of a half configured single sign-on instead of letting it surface as a broken
     * login later. Checked are the settings the flow cannot work without: the client, the two redirect
     * URIs and either discovery through 'issuer-uri' or the three endpoints.
     */
    public void validate() {
        if (!enabled) {
            return;
        }

        List<String> missing = new ArrayList<>();

        if (!StringUtils.hasText(clientId)) {
            missing.add("client-id");
        }
        if (!StringUtils.hasText(clientSecret)) {
            missing.add("client-secret");
        }
        if (!StringUtils.hasText(redirectUri)) {
            missing.add("redirect-uri");
        }
        if (!StringUtils.hasText(frontendRedirectUri)) {
            missing.add("frontend-redirect-uri");
        }
        if (!StringUtils.hasText(issuerUri)) {
            if (!StringUtils.hasText(authorizationUri)) {
                missing.add("authorization-uri");
            }
            if (!StringUtils.hasText(tokenUri)) {
                missing.add("token-uri");
            }
            if (!StringUtils.hasText(jwkSetUri)) {
                missing.add("jwk-set-uri");
            }
        }

        if (!missing.isEmpty()) {
            throw new IllegalStateException("spring.security.oidc is enabled but incomplete, set: "
                    + String.join(", ", missing));
        }
    }

    @PostConstruct
    void validateOnStartup() {
        validate();
    }

    public List<String> getGroups() {
        return groupRoleMapping.stream()
                .map(Group2Role::getGroup)
                .toList();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getIssuerUri() {
        return issuerUri;
    }

    public void setIssuerUri(String issuerUri) {
        this.issuerUri = issuerUri;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public List<String> getScopes() {
        return scopes;
    }

    public void setScopes(List<String> scopes) {
        this.scopes = scopes;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public String getFrontendRedirectUri() {
        return frontendRedirectUri;
    }

    public void setFrontendRedirectUri(String frontendRedirectUri) {
        this.frontendRedirectUri = frontendRedirectUri;
    }

    public String getAuthorizationUri() {
        return authorizationUri;
    }

    public void setAuthorizationUri(String authorizationUri) {
        this.authorizationUri = authorizationUri;
    }

    public String getTokenUri() {
        return tokenUri;
    }

    public void setTokenUri(String tokenUri) {
        this.tokenUri = tokenUri;
    }

    public String getJwkSetUri() {
        return jwkSetUri;
    }

    public void setJwkSetUri(String jwkSetUri) {
        this.jwkSetUri = jwkSetUri;
    }

    public String getUserInfoUri() {
        return userInfoUri;
    }

    public void setUserInfoUri(String userInfoUri) {
        this.userInfoUri = userInfoUri;
    }

    public String getEmailClaim() {
        return emailClaim;
    }

    public void setEmailClaim(String emailClaim) {
        this.emailClaim = emailClaim;
    }

    public String getGroupClaim() {
        return groupClaim;
    }

    public void setGroupClaim(String groupClaim) {
        this.groupClaim = groupClaim;
    }

    public String getDefaultRole() {
        return defaultRole;
    }

    public void setDefaultRole(String defaultRole) {
        this.defaultRole = defaultRole;
    }

    public boolean isJitProvisioning() {
        return jitProvisioning;
    }

    public void setJitProvisioning(boolean jitProvisioning) {
        this.jitProvisioning = jitProvisioning;
    }

    public boolean isRequireVerifiedEmail() {
        return requireVerifiedEmail;
    }

    public void setRequireVerifiedEmail(boolean requireVerifiedEmail) {
        this.requireVerifiedEmail = requireVerifiedEmail;
    }

    public boolean isWeakMatching() {
        return weakMatching;
    }

    public void setWeakMatching(boolean weakMatching) {
        this.weakMatching = weakMatching;
    }

    public List<Group2Role> getGroupRoleMapping() {
        return groupRoleMapping;
    }

    public void setGroupRoleMapping(List<Group2Role> groupRoleMapping) {
        this.groupRoleMapping = groupRoleMapping;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public int getStateActivityTime() {
        return stateActivityTime;
    }

    public void setStateActivityTime(int stateActivityTime) {
        this.stateActivityTime = stateActivityTime;
    }

    public int getTicketActivityTime() {
        return ticketActivityTime;
    }

    public void setTicketActivityTime(int ticketActivityTime) {
        this.ticketActivityTime = ticketActivityTime;
    }

    public String isShowLogs() {
        return showLogs;
    }

    public void setShowLogs(String showLogs) {
        this.showLogs = showLogs;
    }

    public static class Group2Role {
        private String group;
        private String ocRole;

        public String getGroup() {
            return group;
        }

        public void setGroup(String group) {
            this.group = group;
        }

        public String getOcRole() {
            return ocRole;
        }

        public void setOcRole(String ocRole) {
            this.ocRole = ocRole;
        }
    }
}
