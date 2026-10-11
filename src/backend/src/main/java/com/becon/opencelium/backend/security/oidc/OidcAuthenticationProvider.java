package com.becon.opencelium.backend.security.oidc;

import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;

import java.util.Optional;

/**
 * Turns a verified OIDC identity into an authenticated token. Like LdapAuthenticationProvider it
 * does not provision users or assign roles - AuthenticationFilter does that once the token reaches
 * the login pipeline, so sessions, JWT, TOTP and the force-logout broadcast behave exactly as they
 * do for LDAP and BASIC logins.
 *
 * Deciding which account a login belongs to is the security relevant part and is done here: an
 * account is matched by the identity provider's own pair of issuer and subject, never by the email
 * address alone unless the administrator opted into the weak matching fallback. An identity that
 * matches no account is either provisioned by the filter (jitProvisioning) or rejected here.
 */
public class OidcAuthenticationProvider implements AuthenticationProvider {

    private static final Logger logger = LoggerFactory.getLogger(OidcAuthenticationProvider.class);

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

        User user = userService.findByOidcIdentity(identity.issuer(), identity.subject()).orElse(null);

        if (user == null) {
            user = matchByEmail(identity);
        }

        if (user == null && !oidcProperties.isJitProvisioning()) {
            throw new OidcLoginException("user_not_provisioned",
                    "User '" + identity.email() + "' is not provisioned in OpenCelium.");
        }

        OidcUserDetails userDetails = new OidcUserDetails(identity, user);

        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    /**
     * Fallback for identity provider migrations: an account that moved to another provider keeps its
     * email but gets a new subject, so nothing links to the old identity any more. Only when weak
     * matching is enabled deliberately may an existing account with the same email adopt the login,
     * and it is then linked to the identity that reported it.
     */
    private User matchByEmail(OidcIdentity identity) {
        Optional<User> existing = userService.findByEmail(identity.email());
        if (existing.isEmpty()) {
            return null;
        }

        if (!oidcProperties.isWeakMatching()) {
            throw new OidcLoginException("account_not_linked",
                    "An account with the email '" + identity.email()
                            + "' exists, but it is not linked to this identity of the identity provider.");
        }

        User user = existing.get();
        logger.warn("Weak matching: linking the account of '{}' to issuer '{}' and subject '{}' (was issuer '{}', subject '{}').",
                identity.email(), identity.issuer(), identity.subject(), user.getOidcIssuer(), user.getOidcSubject());

        user.setOidcIssuer(identity.issuer());
        user.setOidcSubject(identity.subject());

        return user;
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return OidcAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
