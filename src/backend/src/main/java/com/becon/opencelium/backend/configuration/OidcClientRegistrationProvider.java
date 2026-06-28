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

import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrations;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Builds the {@link ClientRegistration} from {@link OidcProperties} on first use and caches it.
 * Endpoints are resolved through the provider's {@code .well-known/openid-configuration} document
 * when {@code issuer-uri} is set, otherwise from the manually configured endpoints. Resolution is
 * lazy so OpenCelium startup is not coupled to the identity provider's availability; a failed build
 * is retried on the next login attempt.
 */
@Component
public class OidcClientRegistrationProvider {
    public static final String REGISTRATION_ID = "oidc";

    private final OidcProperties properties;
    private volatile ClientRegistration cached;

    public OidcClientRegistrationProvider(OidcProperties properties) {
        this.properties = properties;
    }

    public ClientRegistration get() {
        ClientRegistration result = cached;
        if (result == null) {
            synchronized (this) {
                result = cached;
                if (result == null) {
                    result = build();
                    cached = result;
                }
            }
        }
        return result;
    }

    private ClientRegistration build() {
        // Manual configuration takes precedence when explicit endpoints are provided; otherwise the
        // endpoints are discovered from {issuer-uri}/.well-known/openid-configuration.
        boolean manual = StringUtils.hasText(properties.getAuthorizationUri());

        ClientRegistration.Builder builder;
        if (!manual && StringUtils.hasText(properties.getIssuerUri())) {
            builder = ClientRegistrations.fromIssuerLocation(properties.getIssuerUri())
                    .registrationId(REGISTRATION_ID);
        } else {
            builder = ClientRegistration.withRegistrationId(REGISTRATION_ID)
                    .authorizationUri(properties.getAuthorizationUri())
                    .tokenUri(properties.getTokenUri())
                    .jwkSetUri(properties.getJwkSetUri())
                    .userInfoUri(properties.getUserInfoUri())
                    // Optional: lets the ID-token issuer be validated even in manual mode.
                    .issuerUri(properties.getIssuerUri());
        }

        String redirectUri = StringUtils.hasText(properties.getRedirectUri())
                ? properties.getRedirectUri()
                : "{baseUrl}/oidc/callback";

        return builder
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .clientId(properties.getClientId())
                .clientSecret(properties.getClientSecret())
                .clientAuthenticationMethod(new ClientAuthenticationMethod(properties.getClientAuthenticationMethod()))
                .scope(properties.getScopes())
                .redirectUri(redirectUri)
                .build();
    }
}
