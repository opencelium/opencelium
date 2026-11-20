package io.opencelium.core.testsupport.fake;

import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.function.HandlerFunction;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.RouterFunctions;
import org.springframework.web.servlet.function.ServerResponse;

import io.opencelium.core.tenant.CurrentTenant;
import io.opencelium.core.tenant.NoCurrentTenantException;
import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.testsupport.fixture.TestDocument;

/**
 * A test endpoint that answers with the current tenant of its request, and that writes 1 {@link TestDocument} for
 * the current tenant. A full-application test with MockMvc imports it with {@code @Import(TenantEndpoint.class)}. Its
 * security filter chain permits each request to its paths, so that a test gives the principal of a login, or none.
 * The chain comes before the chains of core and matches the paths of this endpoint only: the main chain of core
 * matches each other request.
 * <p>
 * The class has no stereotype annotation and the routes are functional, with no controller class: the starts of
 * {@code CoreStartup} scan the test classes too, have no web server, and must not find a filter chain or an endpoint
 * here.
 */
public final class TenantEndpoint {

	/** GET or POST: the answer is the ID of the current tenant, or {@link #NO_TENANT}. */
	public static final String PATH = "/test/tenant";

	/** POST {@code {"name": ...}}: writes 1 test document for the current tenant and answers with its tenant ID. */
	public static final String DOCUMENTS_PATH = PATH + "/documents";

	/** The answer of {@link #PATH} when the request runs without a current tenant. */
	public static final String NO_TENANT = "no current tenant";

	@Bean
	@Order(Ordered.HIGHEST_PRECEDENCE)
	SecurityFilterChain tenantEndpointSecurity(HttpSecurity http) throws Exception {
		return http.securityMatcher(PATH, PATH + "/**")
				.authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
				.csrf(AbstractHttpConfigurer::disable).build();
	}

	@Bean
	RouterFunction<ServerResponse> tenantEndpointRoutes(CurrentTenant currentTenant, TenantDocuments documents) {
		HandlerFunction<ServerResponse> answerTheCurrentTenant = request -> {
			try {
				return ServerResponse.ok().body(currentTenant.get().value());
			}
			catch (NoCurrentTenantException ex) {
				return ServerResponse.ok().body(NO_TENANT);
			}
		};
		return RouterFunctions.route().GET(PATH, answerTheCurrentTenant).POST(PATH, answerTheCurrentTenant)
				.POST(DOCUMENTS_PATH, request -> {
					NewDocument body = request.body(NewDocument.class);
					TestDocument stored = documents.insert(TestDocument.of(currentTenant.get().value(), body.name()));
					return ServerResponse.ok().body(stored.tenantId());
				}).build();
	}

	/** The body of a new test document has no tenant: the current tenant gives it. */
	record NewDocument(String name) {
	}

}
