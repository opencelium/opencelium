package io.opencelium.core.tenant;

import java.security.Principal;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.fake.FakeTenantPrincipal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The principal contract gives the tenant of a login. A request and a WebSocket session give the same user principal,
 * the authentication of Spring Security, so the 2 read the same tenant from it.
 */
class TenantPrincipalTest {

	private static final TenantId ACME = TenantId.of("acme");

	@Test
	void tenantOfGivesTheSameTenantWhenThePrincipalIsOfAWebSocketSession() {
		var handshake = new MockHttpServletRequest();
		handshake.setUserPrincipal(FakeTenantPrincipal.loggedIn(ACME));
		// A WebSocket session keeps the user principal of the request of its handshake; a STOMP message carries it.
		Principal ofTheSession = handshake.getUserPrincipal();

		assertThat(TenantPrincipal.tenantOf(ofTheSession)).contains(ACME);
	}

	@Test
	void tenantOfGivesNoTenantWhenThePrincipalIsNotAuthenticated() {
		Principal beforeTheLogin = UsernamePasswordAuthenticationToken.unauthenticated(new FakeTenantPrincipal(ACME),
				null);

		assertThat(TenantPrincipal.tenantOf(beforeTheLogin)).isEmpty();
	}

}
