package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.security.oidc.OidcAuthorizationState;
import com.becon.opencelium.backend.security.oidc.OidcIdentity;

public interface OidcLoginService {

    /**
     * Prepares the redirect to the identity provider and the values that must be kept until the
     * callback arrives.
     */
    Start beginLogin();

    /**
     * Validates the callback parameters against the values kept from {@link #beginLogin()} and
     * returns the verified identity of the user.
     */
    OidcIdentity completeLogin(String code, String state, OidcAuthorizationState expected);

    /**
     * Issues a single-use ticket that the frontend exchanges for an OpenCelium session.
     */
    String issueTicket(OidcIdentity identity);

    OidcIdentity consumeTicket(String ticket);

    record Start(OidcAuthorizationState state, String authorizationUri) {
    }
}
