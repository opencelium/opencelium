package io.opencelium.core.secrets.keys;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * A token of core is valid only for its own type, its issuer and the signing key that its header names, and only
 * until it expires. The tokens of the tests come from the encoder of the same signing key, so each refused token has
 * a correct signature: the decoder refuses it for its header or its claims.
 */
class TokenSignatureTest {

	private static final Instant NOW = Instant.parse("2026-11-20T10:00:00Z");

	private static final String SESSION_JWT = "oc-session+jwt";

	private static final String REFRESH_TOKEN = "oc-refresh+jwt";

	private static final String ISSUER = "opencelium";

	private static final Duration LIFETIME = Duration.ofMinutes(15);

	private final byte[] material = randomKey();

	private final TokenSignature signature = signatureWithVersion(1);

	@Test
	void decodeAcceptsTheTokenWhenItsTypeIsTheExpectedType() {
		String token = signature.encoder(SESSION_JWT).encode(claims(ISSUER, NOW.plus(LIFETIME))).getTokenValue();

		Jwt decoded = signature.decoder(SESSION_JWT, ISSUER).decode(token);

		assertThat(decoded.getSubject()).isEqualTo("user-1");
		assertThat(decoded.getClaimAsString("iss")).isEqualTo(ISSUER);
		assertThat(decoded.getExpiresAt()).isEqualTo(NOW.plus(LIFETIME));
		assertThat(decoded.getHeaders()).containsEntry("alg", "HS256").containsEntry("typ", SESSION_JWT)
				.containsEntry("kid", "1");
	}

	@Test
	void decodeStopsWhenTheTokenIsOfTheOtherType() {
		String token = signature.encoder(REFRESH_TOKEN).encode(claims(ISSUER, NOW.plus(LIFETIME))).getTokenValue();

		assertThatExceptionOfType(JwtException.class)
				.isThrownBy(() -> signature.decoder(SESSION_JWT, ISSUER).decode(token));
	}

	@Test
	void decodeStopsWhenTheIssuerIsWrong() {
		String token = signature.encoder(SESSION_JWT).encode(claims("someone-else", NOW.plus(LIFETIME)))
				.getTokenValue();

		assertThatExceptionOfType(JwtException.class)
				.isThrownBy(() -> signature.decoder(SESSION_JWT, ISSUER).decode(token));
	}

	@Test
	void decodeStopsWhenTheKidNamesNoSigningKey() {
		// The same key material as version 1: only the header kid differs, so the signature itself is correct.
		String token = signatureWithVersion(2).encoder(SESSION_JWT).encode(claims(ISSUER, NOW.plus(LIFETIME)))
				.getTokenValue();

		assertThatExceptionOfType(JwtException.class)
				.isThrownBy(() -> signature.decoder(SESSION_JWT, ISSUER).decode(token));
	}

	@Test
	void decodeStopsWhenTheTokenIsExpired() {
		String token = signature.encoder(SESSION_JWT).encode(claims(ISSUER, NOW.minusSeconds(1))).getTokenValue();

		assertThatExceptionOfType(JwtException.class)
				.isThrownBy(() -> signature.decoder(SESSION_JWT, ISSUER).decode(token));
	}

	private TokenSignature signatureWithVersion(int version) {
		var key = new SigningKey(version, material.clone());
		return new TokenSignature(() -> key, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private static JwtEncoderParameters claims(String issuer, Instant expiresAt) {
		return JwtEncoderParameters.from(JwtClaimsSet.builder().issuer(issuer).subject("user-1")
				.issuedAt(expiresAt.minus(LIFETIME)).expiresAt(expiresAt).build());
	}

	private static byte[] randomKey() {
		byte[] key = new byte[SigningKey.LENGTH];
		new SecureRandom().nextBytes(key);
		return key;
	}

}
