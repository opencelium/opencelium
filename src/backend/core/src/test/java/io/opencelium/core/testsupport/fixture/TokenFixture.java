package io.opencelium.core.testsupport.fixture;

import java.security.SecureRandom;
import java.text.ParseException;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.SignedJWT;

/**
 * Tokens that core must not accept, made with the JWT library itself and not with the signature code of core: a test
 * of a refused token must not depend on the code that it tests.
 */
public final class TokenFixture {

	private static final SecureRandom RANDOM = new SecureRandom();

	private TokenFixture() {
	}

	/**
	 * The header and the claims of {@code token}, signed with a new random key that no core instance has. Only the
	 * signature differs from the original token.
	 */
	public static String resignedWithANewKey(String token) {
		byte[] key = new byte[32];
		RANDOM.nextBytes(key);
		try {
			SignedJWT original = SignedJWT.parse(token);
			var forged = new SignedJWT(original.getHeader(), original.getJWTClaimsSet());
			forged.sign(new MACSigner(key));
			return forged.serialize();
		}
		catch (ParseException | JOSEException ex) {
			throw new IllegalArgumentException("Cannot sign the token again.", ex);
		}
	}

}
