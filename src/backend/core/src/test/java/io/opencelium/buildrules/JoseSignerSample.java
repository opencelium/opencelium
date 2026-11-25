package io.opencelium.buildrules;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jwt.SignedJWT;

/**
 * Breaks the rule "cryptography only in core.secrets": a JOSE signer, which holds its key, signs a token outside that
 * package.
 */
class JoseSignerSample {

	void sign(JWSSigner signer, SignedJWT token) throws JOSEException {
		token.sign(signer);
	}

}
