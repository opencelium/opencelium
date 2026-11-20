package io.opencelium.core.secrets.keys;

import java.time.Clock;
import java.util.function.Supplier;

import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;

/**
 * Signs and checks the tokens that core issues, with HS256 and the signing key of the installation. Each core
 * instance of an installation decrypts the same signing key, so a token of 1 instance is valid in each other instance
 * and after a restart.
 * <p>
 * The caller owns the token types, the issuer and the claims, and gives them as parameters; this class owns the key
 * and the algorithm. The encoder of a type writes the type into the header {@code typ} and the version of the signing
 * key into the header {@code kid}. The decoder of a type accepts a token only with that type, that issuer, a correct
 * signature by the signing key that {@code kid} names, and an expiry after the time of the clock of core.
 * <p>
 * Each encode and each decode reads the signing key again: the loader puts it into memory only after all beans exist.
 */
public final class TokenSignature {

	private final Supplier<SigningKey> signingKey;

	private final Clock clock;

	/**
	 * @param signingKey the signing key of the installation; it is read at each call, and never closed here
	 * @param clock      the clock of core, for the expiry of a token
	 */
	TokenSignature(Supplier<SigningKey> signingKey, Clock clock) {
		this.signingKey = signingKey;
		this.clock = clock;
	}

	/**
	 * The encoder of 1 token type. The caller gives the claims only: the encoder writes the header.
	 *
	 * @param type the value of the header {@code typ}, for example {@code oc-session+jwt}
	 */
	public JwtEncoder encoder(String type) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

	/**
	 * The decoder of 1 token type.
	 *
	 * @param type   the only value of the header {@code typ} that the decoder accepts
	 * @param issuer the only value of the claim {@code iss} that the decoder accepts
	 */
	public JwtDecoder decoder(String type, String issuer) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

}
