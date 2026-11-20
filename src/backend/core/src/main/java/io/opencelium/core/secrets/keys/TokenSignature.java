package io.opencelium.core.secrets.keys;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.function.Supplier;

import javax.crypto.SecretKey;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.proc.DefaultJOSEObjectTypeVerifier;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncodingException;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * Signs and checks the tokens that core issues, with HS256 and the signing key of the installation. Each core
 * instance of an installation decrypts the same signing key, so a token of 1 instance is valid in each other instance
 * and after a restart.
 * <p>
 * The caller owns the token types, the issuer and the claims, and gives them as parameters; this class owns the key
 * and the algorithm. The encoder of a type writes the type into the header {@code typ} and the version of the signing
 * key into the header {@code kid}. The decoder of a type accepts a token only with that type, that issuer, a correct
 * signature by the signing key that {@code kid} names, and an expiry after the time of the clock of core. The expiry
 * has no tolerance: a token is not valid after the time in its claim {@code exp}.
 * <p>
 * Each encode and each decode reads the signing key again: the loader puts it into memory only after all beans exist.
 * No reference to a copy of the key outlives the call; the copies that the JCA and the JWT library make are not
 * zeroed.
 */
public final class TokenSignature {

	private static final JWSAlgorithm ALGORITHM = JWSAlgorithm.HS256;

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
		JOSEObjectType tokenType = new JOSEObjectType(type);
		return parameters -> {
			if (parameters.getJwsHeader() != null) {
				throw new JwtEncodingException("The encoder of the token type '" + type + "' writes the header itself.");
			}
			SigningKey key = signingKey.get();
			JWSHeader header = new JWSHeader.Builder(ALGORITHM).type(tokenType).keyID(keyId(key)).build();
			SignedJWT token = new SignedJWT(header, claimsOf(parameters.getClaims()));
			try {
				token.sign(new MACSigner(key.secretKey()));
			}
			catch (JOSEException ex) {
				throw new JwtEncodingException("Cannot sign a token of the type '" + type + "'.", ex);
			}
			return Jwt.withTokenValue(token.serialize()).headers(headers -> headers.putAll(header.toJSONObject()))
					.claims(claims -> claims.putAll(parameters.getClaims().getClaims())).build();
		};
	}

	/**
	 * The decoder of 1 token type.
	 *
	 * @param type   the only value of the header {@code typ} that the decoder accepts
	 * @param issuer the only value of the claim {@code iss} that the decoder accepts
	 */
	public JwtDecoder decoder(String type, String issuer) {
		var processor = new DefaultJWTProcessor<SecurityContext>();
		processor.setJWSTypeVerifier(new DefaultJOSEObjectTypeVerifier<>(new JOSEObjectType(type)));
		processor.setJWSKeySelector((header, context) -> keyNamedBy(header));
		// The claims are checked below with the clock of core, not by the JWT library with the clock of the system.
		processor.setJWTClaimsSetVerifier((claims, context) -> {
		});
		var expiry = new JwtTimestampValidator(Duration.ZERO);
		expiry.setAllowEmptyExpiryClaim(false);
		expiry.setClock(clock);
		var decoder = new NimbusJwtDecoder(processor);
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(expiry, new JwtIssuerValidator(issuer)));
		return decoder;
	}

	/** The signing key when the header names its algorithm and its version; else no key, and the token is refused. */
	private List<SecretKey> keyNamedBy(JWSHeader header) {
		SigningKey key = signingKey.get();
		if (!ALGORITHM.equals(header.getAlgorithm()) || !keyId(key).equals(header.getKeyID())) {
			return List.of();
		}
		return List.of(key.secretKey());
	}

	private static String keyId(SigningKey key) {
		return Integer.toString(key.version());
	}

	/** The JWT library takes a time as a {@link Date}, and writes it as seconds. */
	private static JWTClaimsSet claimsOf(JwtClaimsSet claims) {
		var builder = new JWTClaimsSet.Builder();
		claims.getClaims().forEach((name, value) -> builder.claim(name,
				value instanceof Instant instant ? Date.from(instant) : value));
		return builder.build();
	}

}
