package io.opencelium.core.auth.oidc;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;
import tools.jackson.core.JacksonException;
import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Reads the OIDC discovery document of an issuer URL. Each call has HTTPS only, a timeout, a size limit and no
 * redirect, and an error names the provider ID and never the body of an answer of the IdP.
 * <p>
 * The address of the document is the issuer URL without a terminating {@code /}, then
 * {@value #DISCOVERY_PATH}. The call accepts the status code 200 only, and it reads at most
 * {@value #MAX_DOCUMENT_BYTES} bytes of the body, also when the answer states no length or a wrong one. The document
 * is valid when it is a JSON object, its {@code issuer} is the issuer URL, and its authorization endpoint, token
 * endpoint and key address are absolute HTTPS addresses with a valid port, so that core sends no code, no
 * client secret and no request for a key to a plain HTTP address of an IdP.
 */
public final class OidcDiscovery {

	/** The path that OIDC Discovery appends to the issuer URL. */
	static final String DISCOVERY_PATH = "/.well-known/openid-configuration";

	/**
	 * The longest body of a discovery document. The document of a known IdP has a few kilobytes, so the limit is more
	 * than 10 times that and far below the memory of a core instance.
	 */
	static final int MAX_DOCUMENT_BYTES = 256 * 1024;

	private static final String HTTPS = "https";

	/** The highest TCP port. */
	private static final int MAX_PORT = 65535;

	private static final JsonMapper JSON = JsonMapper.builder().enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
		.build();

	private final ClientHttpRequestFactory requestFactory;

	/**
	 * @param requestFactory the HTTP client of the calls to an IdP, with the timeout and without a redirect
	 */
	public OidcDiscovery(ClientHttpRequestFactory requestFactory) {
		this.requestFactory = requestFactory;
	}

	/**
	 * @param providerId the provider ID, for the message of an error
	 * @param issuerUrl  the issuer URL of the OIDC provider
	 * @return the discovery document, whose issuer is the issuer URL
	 * @throws NoDiscoveryDocumentException when the issuer URL has no HTTPS, or the IdP gives no discovery document
	 *                                      of the issuer URL within the limits of a call
	 */
	public OidcDiscoveryDocument discover(String providerId, String issuerUrl) {
		URI address = addressOf(providerId, issuerUrl);
		byte[] body = fetch(providerId, address);
		JsonNode document = parse(providerId, body);
		if (!issuerUrl.equals(document.path("issuer").stringValue(null))) {
			throw new NoDiscoveryDocumentException(providerId, "the issuer of the document is not the issuer URL");
		}
		return new OidcDiscoveryDocument(issuerUrl, httpsAddress(providerId, document, "authorization_endpoint"),
				httpsAddress(providerId, document, "token_endpoint"), httpsAddress(providerId, document, "jwks_uri"));
	}

	/**
	 * The address of the discovery document. The issuer URL must be a plain HTTPS URL with a host and no port or a
	 * valid one: a query, a fragment or user information would make the appended path wrong or send a login of the
	 * URL to the IdP.
	 */
	private static URI addressOf(String providerId, String issuerUrl) {
		URI issuer;
		try {
			issuer = new URI(issuerUrl);
		}
		catch (URISyntaxException ex) {
			throw new NoDiscoveryDocumentException(providerId, "the issuer URL is not a URL");
		}
		if (!isHttpsWithHost(issuer) || issuer.getRawQuery() != null || issuer.getRawFragment() != null
				|| issuer.getRawUserInfo() != null) {
			throw new NoDiscoveryDocumentException(providerId,
					"the issuer URL has no HTTPS, no host or no valid port, or it has a query, a fragment or user"
							+ " information");
		}
		String withoutSlash = issuerUrl.endsWith("/") ? issuerUrl.substring(0, issuerUrl.length() - 1) : issuerUrl;
		try {
			return new URI(withoutSlash + DISCOVERY_PATH);
		}
		catch (URISyntaxException ex) {
			throw new NoDiscoveryDocumentException(providerId, "the issuer URL is not a URL");
		}
	}

	/**
	 * Calls the address and reads the body of the answer with the status code 200. The response is closed at the end,
	 * which also ends the timeout of the call.
	 */
	private byte[] fetch(String providerId, URI address) {
		try {
			ClientHttpRequest request = requestFactory.createRequest(address, HttpMethod.GET);
			request.getHeaders().setAccept(List.of(MediaType.APPLICATION_JSON));
			try (ClientHttpResponse response = request.execute()) {
				if (response.getStatusCode().value() != HttpStatus.OK.value()) {
					throw new NoDiscoveryDocumentException(providerId,
							"the IdP answered with the status code " + response.getStatusCode().value());
				}
				return bodyOf(providerId, response.getBody());
			}
		}
		catch (IOException | UncheckedIOException ex) {
			// The message of an I/O error can quote the answer, so only the type of the error goes into the message.
			throw new NoDiscoveryDocumentException(providerId,
					"the call to the IdP failed with " + ex.getClass().getSimpleName());
		}
	}

	/** At most {@value #MAX_DOCUMENT_BYTES} bytes: 1 more byte shows that the body is longer than the limit. */
	private static byte[] bodyOf(String providerId, InputStream body) throws IOException {
		byte[] bytes = body.readNBytes(MAX_DOCUMENT_BYTES + 1);
		if (bytes.length > MAX_DOCUMENT_BYTES) {
			throw new NoDiscoveryDocumentException(providerId,
					"the body of the answer is longer than " + MAX_DOCUMENT_BYTES + " bytes");
		}
		return bytes;
	}

	/** A JSON object, parsed without a cause: the message of a parse error can quote the body. */
	private static JsonNode parse(String providerId, byte[] body) {
		JsonNode document;
		try {
			document = JSON.readTree(body);
		}
		catch (JacksonException ex) {
			throw new NoDiscoveryDocumentException(providerId, "the body of the answer is not JSON");
		}
		if (!document.isObject()) {
			throw new NoDiscoveryDocumentException(providerId, "the body of the answer is not a JSON object");
		}
		return document;
	}

	/**
	 * An absolute HTTPS URL with a host, and with no port or a port from 1 to 65535. The URI class of the JDK accepts a
	 * larger port, and the HTTP client refuses it with an exception that no caller expects, so the check must come
	 * before each request.
	 */
	private static boolean isHttpsWithHost(URI address) {
		int port = address.getPort();
		return HTTPS.equalsIgnoreCase(address.getScheme()) && address.getHost() != null
				&& (port == -1 || (port >= 1 && port <= MAX_PORT));
	}

	/** The address in the field of the document: a text that is an absolute HTTPS URL with a host and a valid port. */
	private static URI httpsAddress(String providerId, JsonNode document, String field) {
		String text = document.path(field).stringValue(null);
		if (text != null) {
			try {
				URI address = new URI(text);
				if (isHttpsWithHost(address)) {
					return address;
				}
			}
			catch (URISyntaxException ex) {
				// The same refusal as for an address without HTTPS.
			}
		}
		throw new NoDiscoveryDocumentException(providerId,
				"the field " + field + " of the document is missing or is no HTTPS URL with a host and a valid port");
	}

}
