package io.opencelium.core.testsupport;

import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/**
 * The requests of the settings API, as the HTTP client sends them, with a token as the bearer token.
 */
public final class SettingsRequests {

	public static final String PATH = "/api/settings";

	private SettingsRequests() {
	}

	/** A read of the settings, with the token as the bearer token. */
	public static MvcTestResult read(MockMvcTester mvc, String token) {
		return mvc.get().uri(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).exchange();
	}

	/** The JSON path of a field of a setting in a response, for example {@code $['broker.port'].value}. */
	public static String field(String settingKey, String field) {
		return "$['" + settingKey + "']." + field;
	}

}
