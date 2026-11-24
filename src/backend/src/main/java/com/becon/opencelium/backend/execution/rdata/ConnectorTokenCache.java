package com.becon.opencelium.backend.execution.rdata;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Keeps, per connector, the values of its fields that are computed by calling one of the
 * invoker's functions, e.g. a token read from the login response with
 * {@code %{login.body.accessToken}}. Requests made on demand (not by a workflow run) then do not
 * log in to the API again on every call.
 *
 * <p>An entry is used only while it is younger than the time to live and while the connector's
 * fields still have the values it was computed from: each entry carries a fingerprint of those
 * values, so a changed credential, URL or certificate setting is never answered from the cache.
 * A connector has at most one entry; a newer one replaces it. A caller whose request is refused
 * with the cached values evicts them, and the next lookup logs in again.
 *
 * <p>Only callers that opt in use the cache: workflow runs compute the fields every time. State
 * is kept in memory and per instance: it does not survive a restart and is not shared between
 * nodes. Two callers that miss at the same moment may both log in; the later entry wins.
 *
 * <p>Setting, optional: {@code opencelium.connector.token-cache-ttl} in milliseconds (default
 * 5 minutes).
 */
@Component
public class ConnectorTokenCache {

    private final Duration ttl;
    private final Clock clock;
    private final Map<Integer, Entry> entries = new ConcurrentHashMap<>();

    @Autowired
    public ConnectorTokenCache(@Value("${opencelium.connector.token-cache-ttl:300000}") long ttlMillis) {
        this(Duration.ofMillis(ttlMillis), Clock.systemUTC());
    }

    /** For tests, which need to move time forward. */
    public ConnectorTokenCache(Duration ttl, Clock clock) {
        if (ttl.isNegative() || ttl.isZero()) {
            throw new IllegalArgumentException("Connector token cache time to live must be positive");
        }
        this.ttl = ttl;
        this.clock = clock;
    }

    /**
     * Returns the fingerprint of the fields of {@code connector}: equal fingerprints mean the
     * computed fields would be requested with the same values.
     *
     * @param requestData the fields of {@code connector} as they are sent to compute the others:
     *                    global variables resolved, computed fields not yet computed
     */
    public static String fingerprintOf(Connector connector, List<RequestData> requestData) {
        StringBuilder text = new StringBuilder();
        appendPart(text, connector.getInvoker());
        appendPart(text, String.valueOf(connector.isTrustCertificate()));
        requestData.stream()
                .sorted(Comparator.comparing(RequestData::getField))
                .forEach(data -> {
                    appendPart(text, data.getField());
                    appendPart(text, data.getValue());
                });
        return HexFormat.of().formatHex(sha256(text.toString()));
    }

    /**
     * Returns the computed fields cached for {@code connectorId}, when they were computed from
     * fields with this {@code fingerprint} and have not expired. A stale entry is dropped.
     */
    public Optional<Map<String, String>> find(int connectorId, String fingerprint) {
        Entry entry = entries.get(connectorId);
        if (entry == null) {
            return Optional.empty();
        }
        if (!entry.fingerprint().equals(fingerprint) || !clock.instant().isBefore(entry.expiresAt())) {
            entries.remove(connectorId, entry);
            return Optional.empty();
        }
        return Optional.of(entry.values());
    }

    /**
     * Caches the computed fields of {@code connectorId}, replacing any earlier entry.
     *
     * @param values the computed fields by name; none may be null
     */
    public void put(int connectorId, String fingerprint, Map<String, String> values) {
        entries.put(connectorId, new Entry(fingerprint, Map.copyOf(values), clock.instant().plus(ttl)));
    }

    /** Drops the entry of {@code connectorId}, e.g. after the API refused its token. */
    public void evict(int connectorId) {
        entries.remove(connectorId);
    }

    // length-prefixed, so no two different lists of parts give the same text
    private static void appendPart(StringBuilder text, String part) {
        if (part == null) {
            text.append("-1;");
            return;
        }
        text.append(part.length()).append(':').append(part).append(';');
    }

    private static byte[] sha256(String text) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private record Entry(String fingerprint, Map<String, String> values, Instant expiresAt) {}
}
