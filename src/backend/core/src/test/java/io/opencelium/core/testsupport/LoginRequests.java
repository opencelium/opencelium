package io.opencelium.core.testsupport;

import java.nio.charset.StandardCharsets;

import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.setup.SetupContext;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The requests of a login, of the current OpenCelium user, of a refresh and of a logout, for a full-application test
 * with MockMvc. The default admin of the setup exists in each self-host test database: core makes it at the start of
 * an empty database.
 */
public final class LoginRequests {

	public static final String LOGIN_PATH = "/api/auth";

	public static final String ME_PATH = "/api/auth/me";

	public static final String REFRESH_PATH = "/api/auth/refresh";

	public static final String LOGOUT_PATH = "/api/auth/logout";

	private LoginRequests() {
	}

	/** A login with the name and the password, as the HTTP client sends it. */
	public static MvcTestResult logIn(MockMvcTester mvc, String username, String password) {
		return mvc.post().uri(LOGIN_PATH).contentType(MediaType.APPLICATION_JSON).content(loginBody(username, password))
				.exchange();
	}

	/** The JSON body of a login; the values must need no JSON escape. */
	public static String loginBody(String username, String password) {
		return "{\"username\": \"" + username + "\", \"password\": \"" + password + "\"}";
	}

	/** A successful login of the default admin, with the admin password {@code 1234}. */
	public static MvcTestResult logInAsTheDefaultAdmin(MockMvcTester mvc) {
		MvcTestResult login = logIn(mvc, SetupContext.DEFAULT_ADMIN_USERNAME, SetupContext.FIRST_ADMIN_PASSWORD);
		assertThat(login).as("the login of the default admin").hasStatusOk();
		return login;
	}

	/** The session JWT of a login of the default admin, with the admin password {@code 1234}. */
	public static String sessionJwtOfTheDefaultAdmin(MockMvcTester mvc) {
		return sessionJwtOf(logInAsTheDefaultAdmin(mvc));
	}

	/** The value of the field {@code sessionJwt} in the response of a login or of a refresh. */
	public static String sessionJwtOf(MvcTestResult response) {
		return JsonPath.read(bodyOf(response), "$.sessionJwt");
	}

	/** The value of the field {@code refreshToken} in the response of a login or of a refresh. */
	public static String refreshTokenOf(MvcTestResult response) {
		assertThat(response).as("a response with a refresh token").bodyJson().hasPath("$.refreshToken");
		return JsonPath.read(bodyOf(response), "$.refreshToken");
	}

	/** The body of the response as UTF-8 text, the encoding of a JSON response. */
	public static String bodyOf(MvcTestResult result) {
		return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
	}

	/**
	 * The response is an error in the problem-details form, with the status code in the status line and in the body,
	 * the error code in the field {@code code}, and no token.
	 */
	public static void assertProblem(MvcTestResult response, HttpStatus status, String code) {
		assertThat(response).hasStatus(status).hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
		assertThat(response).bodyJson().extractingPath("$.status").isEqualTo(status.value());
		assertThat(response).bodyJson().extractingPath("$.code").isEqualTo(code);
		assertThat(response).bodyJson().doesNotHavePath("$.sessionJwt").doesNotHavePath("$.refreshToken");
	}

	/** A request for the current OpenCelium user, with the token as the bearer token. */
	public static MvcTestResult me(MockMvcTester mvc, String token) {
		return mvc.get().uri(ME_PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).exchange();
	}

	/** A refresh of the session, with the token as the bearer token. */
	public static MvcTestResult refresh(MockMvcTester mvc, String token) {
		return mvc.post().uri(REFRESH_PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).exchange();
	}

	/** A logout, with the token as the bearer token. */
	public static MvcTestResult logOut(MockMvcTester mvc, String token) {
		return mvc.post().uri(LOGOUT_PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).exchange();
	}

}
