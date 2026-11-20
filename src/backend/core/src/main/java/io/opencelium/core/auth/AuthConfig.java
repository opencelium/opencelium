package io.opencelium.core.auth;

import java.time.Clock;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
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
 * The authentication of core: the login strategies of the deployment mode, the 2 tokens of a session, and 2 security
 * filter chains. The refresh chain accepts a request to the refresh and logout endpoints only with a valid refresh
 * token; the main chain accepts each other request only with a valid session JWT. The decoder of each chain refuses
 * a token of the other type.
 */
@Configuration(proxyBeanMethods = false)
class AuthConfig {

	/** The error page of Spring Boot: an error of an open endpoint must reach it without a login. */
	private static final String ERROR_PATH = "/error";

	@Bean
	SessionTokens sessionTokens(TokenSignature signature, Clock clock) {
		return new SessionTokens(signature.encoder(SessionTokens.SESSION_JWT_TYPE),
				signature.encoder(SessionTokens.REFRESH_TOKEN_TYPE), clock);
	}

	@Bean
	LoginStrategies loginStrategies(OpenCeliumProperties properties, UserService users,
			PasswordEncoder passwordEncoder) {
		return new LoginStrategies(properties.deploymentMode(), new LoginLookup(users), passwordEncoder);
	}

	/**
	 * The refresh chain matches the refresh endpoint and the logout endpoint, with each method, and comes before the
	 * main chain. Each request needs a valid refresh token as the bearer token, and no session JWT; without one it
	 * gets the answer of {@link #refuse}. The login of the request keeps the refresh token as its credentials, because
	 * the session service reads its session ID and its token ID. The chain is stateless, as the main chain.
	 */
	@Bean
	@Order(Ordered.LOWEST_PRECEDENCE - 1)
	@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
	SecurityFilterChain refreshSecurityFilterChain(HttpSecurity http, TokenSignature signature) throws Exception {
		var refreshTokens = new JwtAuthenticationProvider(
				signature.decoder(SessionTokens.REFRESH_TOKEN_TYPE, SessionTokens.ISSUER));
		refreshTokens.setJwtAuthenticationConverter(SessionTokens::authenticationOfRefreshToken);
		var authentication = new ProviderManager(refreshTokens);
		authentication.setEraseCredentialsAfterAuthentication(false);
		var bearerTokenFilter = new BearerTokenAuthenticationFilter(authentication);
		bearerTokenFilter.setAuthenticationEntryPoint(AuthConfig::refuse);
		return http.securityMatcher(SessionController.REFRESH_PATH, SessionController.LOGOUT_PATH)
				.authorizeHttpRequests(requests -> requests.anyRequest().authenticated())
				.addFilter(bearerTokenFilter)
				.exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(AuthConfig::refuse))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.csrf(AbstractHttpConfigurer::disable).logout(AbstractHttpConfigurer::disable).build();
	}

	/**
	 * The main chain matches each request that no other chain matches, so it comes last. The login is open, and it
	 * ignores a bearer token, so that an old session JWT in the header of the HTTP client does not stop a new login.
	 * Each other request needs a valid session JWT as the bearer token; without one it gets the answer of
	 * {@link #refuse}. The chain is stateless: no server session and no cookie, so it needs no CSRF token. Spring
	 * Security exists only in a web application, so a start without a web server has no chain.
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
	 * The answer to a request without a valid token: the status code 401, the header
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
