/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.resource.OidcConfigDTO;
import com.becon.opencelium.backend.resource.OidcInfoDTO;
import com.becon.opencelium.backend.security.oidc.OidcAuthorizationState;
import com.becon.opencelium.backend.security.oidc.OidcIdentity;
import com.becon.opencelium.backend.security.oidc.OidcLoginException;
import com.becon.opencelium.backend.security.oidc.OidcLoginService;
import com.becon.opencelium.backend.security.oidc.OidcStateCookieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Optional;

@Controller
@Tag(name = "Oidc", description = "OpenID Connect single sign-on")
@RequestMapping(value = "/oidc")
public class OidcController {

    private final OidcProperties properties;
    private final OidcLoginService oidcLoginService;
    private final OidcStateCookieService stateCookieService;

    public OidcController(OidcProperties properties, OidcLoginService oidcLoginService,
                          OidcStateCookieService stateCookieService) {
        this.properties = properties;
        this.oidcLoginService = oidcLoginService;
        this.stateCookieService = stateCookieService;
    }

    @Operation(summary = "Tells the frontend whether single sign-on is available")
    @GetMapping("/info")
    public ResponseEntity<OidcInfoDTO> getInfo() {
        return ResponseEntity.ok(new OidcInfoDTO(properties.isEnabled(), properties.getDisplayName()));
    }

    @Operation(summary = "Redirects the browser to the identity provider",
            description = "'clientNonce' is generated and kept by the frontend; only its hash is stored, "
                    + "so that the session can later be handed to that same browser only.")
    @GetMapping("/authorize")
    public ResponseEntity<Void> authorize(@RequestParam String clientNonce,
                                          HttpServletRequest request, HttpServletResponse response) {
        if (!properties.isEnabled()) {
            return ResponseEntity.notFound().build();
        }

        OidcLoginService.Start start;
        try {
            start = oidcLoginService.beginLogin(clientNonce);
        } catch (OidcLoginException e) {
            return ResponseEntity.badRequest().build();
        }

        stateCookieService.write(response, start.state(), request.isSecure());

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(start.authorizationUri()))
                .build();
    }

    @Operation(summary = "Receives the authorization response and hands a one-time code to the frontend")
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam(required = false) String code,
                                         @RequestParam(required = false) String state,
                                         @RequestParam(required = false) String error,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (!properties.isEnabled()) {
            return ResponseEntity.notFound().build();
        }

        Optional<OidcAuthorizationState> expected = stateCookieService.read(request);
        stateCookieService.clear(response);

        if (StringUtils.hasText(error)) {
            return redirectToFrontend("error", error);
        }

        try {
            OidcIdentity identity = oidcLoginService.completeLogin(code, state, expected.orElse(null));

            String clientNonceHash = expected.map(OidcAuthorizationState::clientNonceHash).orElse(null);

            return redirectToFrontend("code", oidcLoginService.issueTicket(identity, clientNonceHash));
        } catch (OidcLoginException e) {
            return redirectToFrontend("error", e.getCode());
        }
    }

    @Operation(summary = "Returns the configured OpenID Connect settings without the client secret")
    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/config")
    public ResponseEntity<OidcConfigDTO> getConfiguration() {
        OidcConfigDTO result = new OidcConfigDTO(
                properties.isEnabled(),
                properties.getDisplayName(),
                properties.getIssuerUri(),
                properties.getClientId(),
                StringUtils.hasText(properties.getClientSecret()),
                properties.getScopes(),
                properties.getRedirectUri(),
                properties.getFrontendRedirectUri(),
                properties.getUserInfoUri(),
                properties.getEmailClaim(),
                properties.getGroupClaim(),
                properties.getDefaultRole(),
                properties.isJitProvisioning(),
                properties.isRequireVerifiedEmail(),
                properties.isWeakMatching(),
                properties.getGroupRoleMapping());

        return ResponseEntity.ok(result);
    }

    private ResponseEntity<Void> redirectToFrontend(String parameter, String value) {
        if (!StringUtils.hasText(properties.getFrontendRedirectUri())) {
            throw new IllegalStateException("'spring.security.oidc.frontend-redirect-uri' must be configured");
        }

        String location = UriComponentsBuilder.fromUriString(properties.getFrontendRedirectUri())
                .queryParam(parameter, value)
                .build()
                .encode()
                .toUriString();

        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(location)).build();
    }
}
