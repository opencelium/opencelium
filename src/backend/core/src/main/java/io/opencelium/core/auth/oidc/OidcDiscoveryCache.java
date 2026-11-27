package io.opencelium.core.auth.oidc;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Keeps the discovery document of an issuer URL for 5 minutes from the time that core read it, so that the open login
 * endpoint does not call the IdP for each request. A use does not extend the life of a document, so a change at the
 * IdP shows within that time. A call that finds no fresh document reads it again; a read that fails keeps nothing, so
 * an IdP that is back is used at the next call.
 * <p>
 * The cache has 1 entry for each issuer URL that a caller asked for in the last 5 minutes: an entry that is too old
 * goes when the next document is kept. The callers take the issuer URLs from the setting of the OIDC providers, so
 * their number has no way to grow without a change by an installation admin.
 */
public final class OidcDiscoveryCache {

	private static final Duration LIFE = Duration.ofMinutes(5);

	private final OidcDiscovery discovery;

	private final Clock clock;

	private final Map<String, Kept> kept = new ConcurrentHashMap<>();

	/**
	 * @param discovery reads the discovery document of an issuer URL
	 * @param clock     gives the time of a read and the age of a kept document
	 */
	public OidcDiscoveryCache(OidcDiscovery discovery, Clock clock) {
		this.discovery = discovery;
		this.clock = clock;
	}

	/**
	 * @param providerId the provider ID, for the message of an error
	 * @param issuerUrl  the issuer URL of the OIDC provider
	 * @return the kept discovery document when it is younger than 5 minutes, else a document that was just read
	 * @throws NoDiscoveryDocumentException when the document must be read, and the issuer URL has no HTTPS or the IdP
	 *                                      gives no discovery document of the issuer URL within the limits of a call
	 */
	public OidcDiscoveryDocument discover(String providerId, String issuerUrl) {
		Instant now = clock.instant();
		Kept found = kept.get(issuerUrl);
		if (found != null && found.isFreshAt(now)) {
			return found.document();
		}
		OidcDiscoveryDocument document = discovery.discover(providerId, issuerUrl);
		kept.values().removeIf(old -> !old.isFreshAt(now));
		kept.put(issuerUrl, new Kept(document, now));
		return document;
	}

	private record Kept(OidcDiscoveryDocument document, Instant readAt) {

		boolean isFreshAt(Instant time) {
			return time.isBefore(readAt.plus(LIFE));
		}

	}

}
