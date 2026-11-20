package io.opencelium.core.auth;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.util.Map;

import com.jayway.jsonpath.JsonPath;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import io.opencelium.core.secrets.keys.EncryptedSigningKey;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Each core instance of an installation accepts the session JWT of each other instance, also after a restart. Each
 * start runs the real application with a web server on a random port, on the 1 database of the test class and with
 * the 1 master key of its data directory, as 2 instances of 1 installation do.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class SessionJwtInstancesTest {

	private static final String DATABASE = LocalMongo.databaseFor(SessionJwtInstancesTest.class);

	private static final HttpClient HTTP = HttpClient.newHttpClient();

	@TempDir
	static Path dataDir;

	@Test
	void meAcceptsTheSessionJwtWhenAnotherSpringContextIssuedIt() throws Exception {
		try (ConfigurableApplicationContext first = start(); ConfigurableApplicationContext second = start()) {
			String sessionJwt = logInAsTheDefaultAdmin(first);

			HttpResponse<String> me = me(second, sessionJwt);

			assertThat(me.statusCode()).isEqualTo(200);
			assertThat((String) JsonPath.read(me.body(), "$.username")).isEqualTo(SetupContext.DEFAULT_ADMIN_USERNAME);
		}
		assertThat(signingKeyCount()).isEqualTo(1);
	}

	@Test
	void meAcceptsTheSessionJwtWhenCoreStartsAgain() throws Exception {
		String sessionJwt;
		try (ConfigurableApplicationContext first = start()) {
			sessionJwt = logInAsTheDefaultAdmin(first);
		}

		try (ConfigurableApplicationContext again = start()) {
			HttpResponse<String> me = me(again, sessionJwt);

			assertThat(me.statusCode()).isEqualTo(200);
			assertThat((String) JsonPath.read(me.body(), "$.username")).isEqualTo(SetupContext.DEFAULT_ADMIN_USERNAME);
		}
	}

	private static ConfigurableApplicationContext start() {
		return CoreStartup.run(Map.of(), dataDir, CoreStartup.mongoUri(LocalMongo.uri(DATABASE)),
				CoreStartup.arg("spring.main.web-application-type", "servlet"), CoreStartup.arg("server.port", "0"));
	}

	private static String logInAsTheDefaultAdmin(ConfigurableApplicationContext instance)
			throws IOException, InterruptedException {
		String body = "{\"username\": \"" + SetupContext.DEFAULT_ADMIN_USERNAME + "\", \"password\": \""
				+ SetupContext.FIRST_ADMIN_PASSWORD + "\"}";
		HttpResponse<String> login = HTTP.send(HttpRequest.newBuilder(uri(instance, LoginRequests.LOGIN_PATH))
				.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
		assertThat(login.statusCode()).as("the status code of the login").isEqualTo(200);
		return JsonPath.read(login.body(), "$.sessionJwt");
	}

	private static HttpResponse<String> me(ConfigurableApplicationContext instance, String sessionJwt)
			throws IOException, InterruptedException {
		return HTTP.send(HttpRequest.newBuilder(uri(instance, LoginRequests.ME_PATH))
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + sessionJwt).GET().build(),
				HttpResponse.BodyHandlers.ofString());
	}

	private static URI uri(ConfigurableApplicationContext instance, String path) {
		return URI.create("http://localhost:" + instance.getEnvironment().getProperty("local.server.port") + path);
	}

	private static long signingKeyCount() {
		try (MongoClient client = MongoClients.create(LocalMongo.uri(DATABASE))) {
			return client.getDatabase(DATABASE).getCollection(EncryptedSigningKey.COLLECTION).countDocuments();
		}
	}

}
