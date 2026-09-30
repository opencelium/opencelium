package com.becon.opencelium.backend.security.oidc;

import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.database.mysql.service.OidcLoginService;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;

/**
 * Turns a verified OIDC identity into an authenticated token. Like LdapAuthenticationProvider it
 * does not provision users or assign roles - AuthenticationFilter does that once the token reaches
 * the login pipeline, so sessions, JWT, TOTP and the force-logout broadcast behave exactly as they
 * do for LDAP and BASIC logins. The one decision taken here is whether an unknown user is allowed
 * in at all, so that a rejection surfaces as a proper authentication failure.
 */
public class OidcAuthenticationProvider implements AuthenticationProvider {

    private final OidcLoginService oidcLoginService;
    private final UserService userService;
    private final OidcProperties oidcProperties;

    public OidcAuthenticationProvider(OidcLoginService oidcLoginService, UserService userService,
                                      OidcProperties oidcProperties) {
        this.oidcLoginService = oidcLoginService;
        this.userService = userService;
        this.oidcProperties = oidcProperties;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        OidcIdentity identity = oidcLoginService.consumeTicket((String) authentication.getCredentials());

        if (!oidcProperties.isJitProvisioning() && !userService.existsByEmail(identity.email())) {
            throw new OidcLoginException("user_not_provisioned",
                    "User '" + identity.email() + "' is not provisioned in OpenCelium.");
        }

        OidcUserDetails userDetails = new OidcUserDetails(identity);

        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return OidcAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
