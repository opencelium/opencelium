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
 * The requests of a login and of the current OpenCelium user, for a full-application test with MockMvc. The default
 * admin of the setup exists in each self-host test database: core makes it at the start of an empty database.
 */
public final class LoginRequests {

	public static final String LOGIN_PATH = "/api/auth/login";

	public static final String ME_PATH = "/api/auth/me";

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

	/** The session JWT of a login of the default admin, with the admin password {@code 1234}. */
	public static String sessionJwtOfTheDefaultAdmin(MockMvcTester mvc) {
		MvcTestResult login = logIn(mvc, SetupContext.DEFAULT_ADMIN_USERNAME, SetupContext.FIRST_ADMIN_PASSWORD);
		assertThat(login).as("the login of the default admin").hasStatusOk();
		return sessionJwtOf(login);
	}

	/** The value of the field {@code sessionJwt} in the response of a login. */
	public static String sessionJwtOf(MvcTestResult login) {
		return JsonPath.read(bodyOf(login), "$.sessionJwt");
	}

	/** The body of the response as UTF-8 text, the encoding of a JSON response. */
	public static String bodyOf(MvcTestResult result) {
		return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
	}

	/**
	 * The response is an error in the problem-details form, with the status code in the status line and in the body,
	 * the error code in the field {@code code}, and no session JWT.
	 */
	public static void assertProblem(MvcTestResult response, HttpStatus status, String code) {
		assertThat(response).hasStatus(status).hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
		assertThat(response).bodyJson().extractingPath("$.status").isEqualTo(status.value());
		assertThat(response).bodyJson().extractingPath("$.code").isEqualTo(code);
		assertThat(response).bodyJson().doesNotHavePath("$.sessionJwt");
	}

	/** A request for the current OpenCelium user, with the token as the bearer token. */
	public static MvcTestResult me(MockMvcTester mvc, String token) {
		return mvc.get().uri(ME_PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).exchange();
	}

}
