package io.opencelium.core.settings;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.util.Map;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.SettingsRequests;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A change of a setting through 1 core instance is the value of the next read through each other core instance of
 * the installation, without a restart. Each start runs the real application with a web server on a random port, on
 * the 1 database of the test class and with the 1 master key of its data directory, as 2 instances of 1 installation
 * do.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class SettingsInstancesTest {

	private static final String DATABASE = LocalMongo.databaseFor(SettingsInstancesTest.class);

	private static final HttpClient HTTP = HttpClient.newHttpClient();

	@TempDir
	static Path dataDir;

	@Test
	void getGivesTheNewValueWhenAnotherCoreInstanceChangesIt() throws Exception {
		try (ConfigurableApplicationContext first = start(); ConfigurableApplicationContext second = start()) {
			String sessionJwt = logInAsTheDefaultAdmin(first);
			HttpResponse<String> before = send(second, sessionJwt, "GET", null);
			assertThat(before.statusCode()).as("the status code of the read before the change").isEqualTo(200);
			assertThat((Integer) JsonPath.read(before.body(), SettingsRequests.field("broker.port", "value")))
					.as("the port before the change").isEqualTo(5672);

			HttpResponse<String> change = send(first, sessionJwt, "PATCH", "{\"broker.port\": 5673}");
			assertThat(change.statusCode()).as("the status code of the change").isEqualTo(200);

			HttpResponse<String> read = send(second, sessionJwt, "GET", null);
			assertThat(read.statusCode()).isEqualTo(200);
			assertThat((Integer) JsonPath.read(read.body(), SettingsRequests.field("broker.port", "value")))
					.isEqualTo(5673);
			assertThat((Boolean) JsonPath.read(read.body(), SettingsRequests.field("broker.port", "default")))
					.isFalse();
		}
	}

	private static ConfigurableApplicationContext start() {
		return CoreStartup.run(Map.of(), dataDir, CoreStartup.mongoUri(LocalMongo.uri(DATABASE)),
				CoreStartup.arg("spring.main.web-application-type", "servlet"), CoreStartup.arg("server.port", "0"));
	}

	private static String logInAsTheDefaultAdmin(ConfigurableApplicationContext instance)
			throws IOException, InterruptedException {
		String body = LoginRequests.loginBody(SetupContext.DEFAULT_ADMIN_USERNAME, SetupContext.FIRST_ADMIN_PASSWORD);
		HttpResponse<String> login = HTTP.send(HttpRequest.newBuilder(uri(instance, LoginRequests.LOGIN_PATH))
				.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
		assertThat(login.statusCode()).as("the status code of the login").isEqualTo(200);
		return JsonPath.read(login.body(), "$.sessionJwt");
	}

	/** A request of the settings API to the instance; {@code body} is {@code null} for a request without a body. */
	private static HttpResponse<String> send(ConfigurableApplicationContext instance, String sessionJwt, String method,
			String body) throws IOException, InterruptedException {
		HttpRequest.BodyPublisher publisher = body == null ? HttpRequest.BodyPublishers.noBody()
				: HttpRequest.BodyPublishers.ofString(body);
		return HTTP.send(HttpRequest.newBuilder(uri(instance, SettingsRequests.PATH))
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + sessionJwt)
				.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE).method(method, publisher).build(),
				HttpResponse.BodyHandlers.ofString());
	}

	private static URI uri(ConfigurableApplicationContext instance, String path) {
		return URI.create("http://localhost:" + instance.getEnvironment().getProperty("local.server.port") + path);
	}

}
