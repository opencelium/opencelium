package com.becon.opencelium.backend.resource;

import com.becon.opencelium.backend.configuration.OidcProperties;
import jakarta.annotation.Resource;

import java.util.List;

/**
 * Sanitized OIDC configuration for the admin panel. The client secret is never exposed.
 */
@Resource
public class OidcConfigDTO {
    private boolean enabled;
    private String providerName;
    private String buttonText;
    private String issuerUri;
    private String authorizationUri;
    private String tokenUri;
    private String jwkSetUri;
    private String userInfoUri;
    private String clientId;
    private String clientSecret = "[PROTECTED]";
    private String clientAuthenticationMethod;
    private List<String> scopes;
    private String usernameClaim;
    private String emailClaim;
    private String givenNameClaim;
    private String familyNameClaim;
    private String phoneNumberClaim;
    private String departmentClaim;
    private String organizationClaim;
    private String groupsClaim;
    private List<OidcProperties.Group2Role> groupRoleMapping;
    private String defaultRole;
    private boolean jitProvisioning;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getButtonText() {
        return buttonText;
    }

    public void setButtonText(String buttonText) {
        this.buttonText = buttonText;
    }

    public String getIssuerUri() {
        return issuerUri;
    }

    public void setIssuerUri(String issuerUri) {
        this.issuerUri = issuerUri;
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

    public String getClientAuthenticationMethod() {
        return clientAuthenticationMethod;
    }

    public void setClientAuthenticationMethod(String clientAuthenticationMethod) {
        this.clientAuthenticationMethod = clientAuthenticationMethod;
    }

    public List<String> getScopes() {
        return scopes;
    }

    public void setScopes(List<String> scopes) {
        this.scopes = scopes;
    }

    public String getUsernameClaim() {
        return usernameClaim;
    }

    public void setUsernameClaim(String usernameClaim) {
        this.usernameClaim = usernameClaim;
    }

    public String getEmailClaim() {
        return emailClaim;
    }

    public void setEmailClaim(String emailClaim) {
        this.emailClaim = emailClaim;
    }

    public String getGivenNameClaim() {
        return givenNameClaim;
    }

    public void setGivenNameClaim(String givenNameClaim) {
        this.givenNameClaim = givenNameClaim;
    }

    public String getFamilyNameClaim() {
        return familyNameClaim;
    }

    public void setFamilyNameClaim(String familyNameClaim) {
        this.familyNameClaim = familyNameClaim;
    }

    public String getPhoneNumberClaim() {
        return phoneNumberClaim;
    }

    public void setPhoneNumberClaim(String phoneNumberClaim) {
        this.phoneNumberClaim = phoneNumberClaim;
    }

    public String getDepartmentClaim() {
        return departmentClaim;
    }

    public void setDepartmentClaim(String departmentClaim) {
        this.departmentClaim = departmentClaim;
    }

    public String getOrganizationClaim() {
        return organizationClaim;
    }

    public void setOrganizationClaim(String organizationClaim) {
        this.organizationClaim = organizationClaim;
    }

    public String getGroupsClaim() {
        return groupsClaim;
    }

    public void setGroupsClaim(String groupsClaim) {
        this.groupsClaim = groupsClaim;
    }

    public List<OidcProperties.Group2Role> getGroupRoleMapping() {
        return groupRoleMapping;
    }

    public void setGroupRoleMapping(List<OidcProperties.Group2Role> groupRoleMapping) {
        this.groupRoleMapping = groupRoleMapping;
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
}
