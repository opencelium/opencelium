package io.opencelium.core.testsupport.fake;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.mock.http.client.MockClientHttpResponse;
import tools.jackson.databind.json.JsonMapper;

/**
 * An IdP for the tests, without a network: a request factory of the HTTP client of Spring that answers each request
 * from memory. A test lets it serve the discovery document of an issuer URL, or a fixed answer at an address; each
 * other address gets the status code 404 with an empty body. It records the address of each request, so that a test
 * sees that core made no request. A served answer has no {@code Content-Length} header, as a chunked answer.
 * <p>
 * A unit test gives it to the OIDC client of core as its request factory. A full-application test puts it in place of
 * the bean {@value #BEAN_NAME}, the HTTP client of the calls of core to an IdP. Each test class has its own application
 * context, so each test class has its own fake in a static field:
 * <pre>{@code
 * static final FakeIdp IDP = new FakeIdp();
 *
 * @TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
 * ClientHttpRequestFactory oidcRequestFactory;
 *
 * static ClientHttpRequestFactory fakeIdp() {
 *     return IDP;
 * }
 * }</pre>
 */
public final class FakeIdp implements ClientHttpRequestFactory {

	/** The name of the bean of the HTTP client of the calls of core to an IdP. */
	public static final String BEAN_NAME = "oidcRequestFactory";

	/** The path that OIDC Discovery 1.0 appends to an issuer URL for its discovery document. */
	public static final String DISCOVERY_PATH = "/.well-known/openid-configuration";

	/** The path of the login page below the issuer URL, in a served discovery document. */
	public static final String AUTHORIZATION_PATH = "/authorize";

	/** The path of the token request below the issuer URL, in a served discovery document. */
	public static final String TOKEN_PATH = "/token";

	/** The path of the public keys below the issuer URL, in a served discovery document. */
	public static final String KEYS_PATH = "/keys";

	private static final JsonMapper JSON = JsonMapper.builder().build();

	private final Map<URI, Answer> answers = new ConcurrentHashMap<>();

	private final List<URI> requests = new CopyOnWriteArrayList<>();

	/** Serves the discovery document of the issuer URL: its issuer is the issuer URL, as {@link #documentOf}. */
	public void serveDiscoveryDocument(String issuerUrl) {
		serveDiscoveryDocument(issuerUrl, documentOf(issuerUrl));
	}

	/** Serves the JSON text as the discovery document of the issuer URL, with the status code 200. */
	public void serveDiscoveryDocument(String issuerUrl, String document) {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		answer(discoveryUrlOf(issuerUrl), HttpStatus.OK, headers, document);
	}

	/** Answers each request to the address with the status code, the headers and the body. */
	public void answer(String url, HttpStatusCode status, HttpHeaders headers, String body) {
		HttpHeaders copy = new HttpHeaders();
		copy.putAll(headers);
		answers.put(URI.create(url), new Answer(status, copy, body.getBytes(StandardCharsets.UTF_8)));
	}

	/** A request to the address fails with an I/O error and gets no answer, as a host that does not answer. */
	public void unreachable(String url) {
		answers.put(URI.create(url), new Answer(null, new HttpHeaders(), new byte[0]));
	}

	/** The address of each request, in the order of the requests. */
	public List<URI> requests() {
		return List.copyOf(requests);
	}

	/** Removes each answer and each recorded request. */
	public void reset() {
		answers.clear();
		requests.clear();
	}

	/**
	 * The address of the discovery document of the issuer URL: the issuer URL without a terminating {@code /}, then
	 * {@value #DISCOVERY_PATH} (OIDC Discovery 1.0, section 4.1).
	 */
	public static String discoveryUrlOf(String issuerUrl) {
		return withoutTerminatingSlash(issuerUrl) + DISCOVERY_PATH;
	}

	/**
	 * A discovery document with each field that OIDC Discovery 1.0 requires for the authorization code flow: the
	 * issuer, and the login page, the token request and the public keys below the issuer.
	 */
	public static String documentOf(String issuer) {
		return documentOf(issuer, Map.of());
	}

	/** A discovery document as {@link #documentOf(String)}, with more fields or other values of its fields. */
	public static String documentOf(String issuer, Map<String, ?> moreFields) {
		Map<String, Object> document = fieldsOf(issuer);
		document.putAll(moreFields);
		return JSON.writeValueAsString(document);
	}

	/** A discovery document as {@link #documentOf(String)}, without the field. */
	public static String documentWithout(String issuer, String field) {
		Map<String, Object> document = fieldsOf(issuer);
		document.remove(field);
		return JSON.writeValueAsString(document);
	}

	private static Map<String, Object> fieldsOf(String issuer) {
		String base = withoutTerminatingSlash(issuer);
		Map<String, Object> document = new LinkedHashMap<>();
		document.put("issuer", issuer);
		document.put("authorization_endpoint", base + AUTHORIZATION_PATH);
		document.put("token_endpoint", base + TOKEN_PATH);
		document.put("jwks_uri", base + KEYS_PATH);
		document.put("response_types_supported", List.of("code"));
		document.put("subject_types_supported", List.of("public"));
		document.put("id_token_signing_alg_values_supported", List.of("RS256"));
		return document;
	}

	@Override
	public ClientHttpRequest createRequest(URI uri, HttpMethod httpMethod) {
		return new MockClientHttpRequest(httpMethod, uri) {

			@Override
			protected ClientHttpResponse executeInternal() throws IOException {
				requests.add(uri);
				Answer answer = answers.get(uri);
				return answer != null ? answer.response(uri)
						: new MockClientHttpResponse(new byte[0], HttpStatus.NOT_FOUND);
			}

		};
	}

	private static String withoutTerminatingSlash(String url) {
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}

	/**
	 * @param status the status code, or {@code null} for a host that does not answer
	 */
	private record Answer(HttpStatusCode status, HttpHeaders headers, byte[] body) {

		ClientHttpResponse response(URI uri) throws IOException {
			if (status == null) {
				throw new ConnectException("The test IdP does not answer at " + uri + ".");
			}
			var response = new MockClientHttpResponse(body.clone(), status);
			response.getHeaders().putAll(headers);
			return response;
		}

	}

}
