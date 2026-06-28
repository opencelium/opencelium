/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@ConfigurationProperties(prefix = "spring.security.oidc")
public class OidcProperties {
    private boolean enabled = false;
    private String providerName = "OpenID Connect";
    private String buttonText = "Sign in with SSO";

    // When set, endpoints are resolved through {issuer-uri}/.well-known/openid-configuration.
    private String issuerUri;

    // Manual endpoint configuration (used when issuer-uri is not set).
    private String authorizationUri;
    private String tokenUri;
    private String jwkSetUri;
    private String userInfoUri;

    private String clientId;
    private String clientSecret;
    private String clientAuthenticationMethod = "client_secret_basic";
    private List<String> scopes = new ArrayList<>(Arrays.asList("openid", "profile", "email"));

    // Absolute backend callback URL registered at the provider. Derived from the request when blank.
    private String redirectUri;
    // SPA base URL used to bounce back after login. Derived from the request when blank.
    private String frontendRedirectUri;

    // Claim mapping.
    private String usernameClaim = "preferred_username";
    private String emailClaim = "email";
    private String givenNameClaim = "given_name";
    private String familyNameClaim = "family_name";
    private String phoneNumberClaim = "phone_number";
    // No standard OIDC claim; left empty so they only map when explicitly configured.
    private String departmentClaim;
    private String organizationClaim;
    private String groupsClaim = "groups";
    private List<Group2Role> groupRoleMapping = new ArrayList<>();
    private String defaultRole;

    // When false, only already existing users are allowed to log in.
    private boolean jitProvisioning = true;

    public String getRoleByGroup(String group) {
        return groupRoleMapping.stream()
                .filter(mapping -> Objects.equals(group, mapping.oidcGroup))
                .map(Group2Role::getOcRole)
                .findFirst()
                .orElseThrow();
    }

    public List<String> getGroups() {
        return groupRoleMapping.stream()
                .map(OidcProperties.Group2Role::getOidcGroup)
                .toList();
    }

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

    public List<Group2Role> getGroupRoleMapping() {
        return groupRoleMapping;
    }

    public void setGroupRoleMapping(List<Group2Role> groupRoleMapping) {
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

    public static class Group2Role {
        private String oidcGroup;
        private String ocRole;

        public String getOidcGroup() {
            return oidcGroup;
        }

        public void setOidcGroup(String oidcGroup) {
            this.oidcGroup = oidcGroup;
        }

        public String getOcRole() {
            return ocRole;
        }

        public void setOcRole(String ocRole) {
            this.ocRole = ocRole;
        }
    }
}
