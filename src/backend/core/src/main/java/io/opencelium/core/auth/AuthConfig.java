package io.opencelium.core.auth;

import java.time.Clock;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.secrets.keys.TokenSignature;
import io.opencelium.core.user.UserService;

/**
 * The authentication of core: the login strategies of the deployment mode, the session JWT, and the security filter
 * chain that accepts a request only with a valid session JWT.
 */
@Configuration(proxyBeanMethods = false)
class AuthConfig {

	/** The error page of Spring Boot: an error of an open endpoint must reach it without a login. */
	private static final String ERROR_PATH = "/error";

	@Bean
	SessionTokens sessionTokens(TokenSignature signature, Clock clock) {
		return new SessionTokens(signature.encoder(SessionTokens.SESSION_JWT_TYPE), clock);
	}

	@Bean
	LoginStrategies loginStrategies(OpenCeliumProperties properties, UserService users,
			PasswordEncoder passwordEncoder) {
		return new LoginStrategies(properties.deploymentMode(), new LoginLookup(users), passwordEncoder);
	}

	/**
	 * The main chain matches each request. The login is open, and it ignores a bearer token, so that an old session
	 * JWT in the header of the HTTP client does not stop a new login. Each other request needs a valid session JWT as
	 * the bearer token; without one it gets the answer of {@link #refuse}. The chain is stateless: no server session
	 * and no cookie, so it needs no CSRF token. Spring Security exists only in a web application, so a start without a
	 * web server has no chain.
	 * <p>
	 * The chain adds the bearer-token filter of Spring Security itself. The resource-server configurer of Spring
	 * Security would also open an endpoint with the metadata of the resource, and core opens no endpoint that a
	 * feature does not declare.
	 */
	@Bean
	@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
	SecurityFilterChain mainSecurityFilterChain(HttpSecurity http, TokenSignature signature) throws Exception {
		RequestMatcher login = PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, LoginController.PATH);
		var sessionJwts = new JwtAuthenticationProvider(
				signature.decoder(SessionTokens.SESSION_JWT_TYPE, SessionTokens.ISSUER));
		sessionJwts.setJwtAuthenticationConverter(SessionTokens::authenticationOf);
		var headerTokens = new DefaultBearerTokenResolver();
		var bearerTokens = new BearerTokenAuthenticationConverter();
		bearerTokens.setBearerTokenResolver(request -> login.matches(request) ? null : headerTokens.resolve(request));
		var bearerTokenFilter = new BearerTokenAuthenticationFilter(new ProviderManager(sessionJwts), bearerTokens);
		bearerTokenFilter.setAuthenticationEntryPoint(AuthConfig::refuse);
		return http
				.authorizeHttpRequests(requests -> requests.requestMatchers(login).permitAll()
						.requestMatchers(ERROR_PATH).permitAll().anyRequest().authenticated())
				.addFilter(bearerTokenFilter)
				.exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(AuthConfig::refuse))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.csrf(AbstractHttpConfigurer::disable).logout(AbstractHttpConfigurer::disable).build();
	}

	/**
	 * The answer to a request without a valid session JWT: the status code 401, the header
	 * {@code WWW-Authenticate} with the scheme {@code Bearer}, and no body. For a refused token the header adds the
	 * error code of the bearer-token standard, for example {@code invalid_token}, without a description. Core
	 * publishes no metadata of the resource, so the header names none.
	 */
	private static void refuse(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException refusal) {
		String challenge = refusal instanceof OAuth2AuthenticationException token
				? "Bearer error=\"" + token.getError().getErrorCode() + "\"" : "Bearer";
		response.addHeader(HttpHeaders.WWW_AUTHENTICATE, challenge);
		response.setStatus(HttpStatus.UNAUTHORIZED.value());
	}

}
