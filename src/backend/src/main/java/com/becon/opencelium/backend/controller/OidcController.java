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

package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.commons.filter.OwnershipSecurity;
import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.constant.SecurityConstant;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.OidcAuthenticationService;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.resource.OidcConfigDTO;
import com.becon.opencelium.backend.resource.OidcInfoDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import com.becon.opencelium.backend.security.oidc.OidcAuthorization;
import com.becon.opencelium.backend.security.oidc.OidcLoginException;
import com.becon.opencelium.backend.security.oidc.OidcLoginTicket;
import com.becon.opencelium.backend.security.oidc.OidcLoginTransaction;
import com.becon.opencelium.backend.security.oidc.OidcStateCookieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;
import java.util.Optional;

@Controller
@Tag(name = "Oidc", description = "OpenID Connect single sign-on: login flow, token exchange and configuration")
@RequestMapping(value = "/oidc")
public class OidcController {
    private static final Logger logger = LoggerFactory.getLogger(OidcController.class);

    @Autowired
    private OidcProperties properties;

    @Autowired
    private OidcAuthenticationService oidcAuthenticationService;

    @Autowired
    private OidcStateCookieService stateCookieService;

    @Autowired
    private UserService userService;

    @Autowired
    private OwnershipSecurity ownershipSecurity;

    @Operation(summary = "Returns whether OIDC login is enabled (public)")
    @GetMapping("/info")
    public ResponseEntity<OidcInfoDTO> info() {
        return ResponseEntity.ok(new OidcInfoDTO(properties.isEnabled(), properties.getButtonText()));
    }

    @Operation(summary = "Starts the OIDC login flow by redirecting to the identity provider (public)")
    @GetMapping("/authorize")
    public ResponseEntity<Void> authorize(HttpServletRequest request, HttpServletResponse response) {
        if (!properties.isEnabled()) {
            return ResponseEntity.notFound().build();
        }
        String backendRedirectUri = StringUtils.hasText(properties.getRedirectUri())
                ? properties.getRedirectUri()
                : ServletUriComponentsBuilder.fromCurrentContextPath().path("/oidc/callback").build().toUriString();
        String frontendRedirectUri = StringUtils.hasText(properties.getFrontendRedirectUri())
                ? properties.getFrontendRedirectUri()
                : ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

        OidcAuthorization authorization =
                oidcAuthenticationService.createAuthorization(backendRedirectUri, frontendRedirectUri);
        stateCookieService.write(request, response, authorization.getTransaction());

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(authorization.getAuthorizationRequestUri()))
                .build();
    }

    @Operation(summary = "Identity provider redirect target; finishes login and bounces back to the SPA (public)")
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam(required = false) String code,
                                         @RequestParam(required = false) String state,
                                         @RequestParam(required = false) String error,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (!properties.isEnabled()) {
            return ResponseEntity.notFound().build();
        }
        Optional<OidcLoginTransaction> transaction = stateCookieService.read(request);
        stateCookieService.clear(request, response);

        String frontendRedirectUri = transaction.map(OidcLoginTransaction::getFrontendRedirectUri)
                .filter(StringUtils::hasText)
                .orElseGet(() -> ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString());

        if (transaction.isEmpty() || !StringUtils.hasText(state) || !state.equals(transaction.get().getState())) {
            return redirectToSpa(frontendRedirectUri, "error", "invalid_state");
        }
        if (StringUtils.hasText(error)) {
            return redirectToSpa(frontendRedirectUri, "error", error);
        }
        if (!StringUtils.hasText(code)) {
            return redirectToSpa(frontendRedirectUri, "error", "missing_code");
        }

        try {
            String oneTimeCode = oidcAuthenticationService.login(code, transaction.get(), transaction.get().getRedirectUri());
            return redirectToSpa(frontendRedirectUri, "code", oneTimeCode);
        } catch (OidcLoginException e) {
            logger.warn("OIDC login failed: {}", e.getReason());
            return redirectToSpa(frontendRedirectUri, "error", e.getReason());
        } catch (Exception e) {
            logger.error("Unexpected OIDC login failure", e);
            return redirectToSpa(frontendRedirectUri, "error", "login_failed");
        }
    }

    @Operation(summary = "Exchanges a one-time code for the OpenCelium session and token (public)")
    @PostMapping("/token")
    public ResponseEntity<UserResource> token(@RequestBody Map<String, String> body, HttpServletResponse response) {
        OidcLoginTicket ticket = oidcAuthenticationService.consumeTicket(body.get("code"));
        User user = userService.findById(ticket.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found for OIDC ticket"));

        response.addHeader(HttpHeaders.AUTHORIZATION, SecurityConstant.BEARER + " " + ticket.getToken());
        return ResponseEntity.ok(new UserResource(user));
    }

    @Operation(summary = "Returns the OIDC configuration (sanitized, admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Success", content = @Content),
        @ApiResponse(responseCode = "401", description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse(responseCode = "403", description = "Forbidden",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse(responseCode = "500", description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/config")
    public ResponseEntity<OidcConfigDTO> config() {
        ownershipSecurity.checkAdmin();

        OidcConfigDTO result = new OidcConfigDTO();
        result.setEnabled(properties.isEnabled());
        result.setProviderName(properties.getProviderName());
        result.setButtonText(properties.getButtonText());
        result.setIssuerUri(properties.getIssuerUri());
        result.setAuthorizationUri(properties.getAuthorizationUri());
        result.setTokenUri(properties.getTokenUri());
        result.setJwkSetUri(properties.getJwkSetUri());
        result.setUserInfoUri(properties.getUserInfoUri());
        result.setClientId(properties.getClientId());
        result.setClientAuthenticationMethod(properties.getClientAuthenticationMethod());
        result.setScopes(properties.getScopes());
        result.setUsernameClaim(properties.getUsernameClaim());
        result.setEmailClaim(properties.getEmailClaim());
        result.setGivenNameClaim(properties.getGivenNameClaim());
        result.setFamilyNameClaim(properties.getFamilyNameClaim());
        result.setPhoneNumberClaim(properties.getPhoneNumberClaim());
        result.setDepartmentClaim(properties.getDepartmentClaim());
        result.setOrganizationClaim(properties.getOrganizationClaim());
        result.setGroupsClaim(properties.getGroupsClaim());
        result.setGroupRoleMapping(properties.getGroupRoleMapping());
        result.setDefaultRole(properties.getDefaultRole());
        result.setJitProvisioning(properties.isJitProvisioning());

        return ResponseEntity.ok(result);
    }

    private ResponseEntity<Void> redirectToSpa(String frontendRedirectUri, String param, String value) {
        String location = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .replacePath("/oidc/callback")
                .replaceQuery(null)
                .queryParam(param, value)
                .build()
                .toUriString();
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(location)).build();
    }
}
