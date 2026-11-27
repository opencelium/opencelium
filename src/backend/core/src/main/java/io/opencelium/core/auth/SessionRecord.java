package io.opencelium.core.auth;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import io.opencelium.core.tenant.TenantDocument;

/**
 * The state of 1 session, a tenant document of the tenant of its OpenCelium user. The token ID is not a secret: it
 * gives no access without the signature of core. MongoDB removes a record after its end ({@link SessionIndexes}).
 *
 * @param id        the session ID, the claim {@code sid} of the 2 tokens of the session
 * @param userId    the ID of the OpenCelium user of the session
 * @param tokenId   the claim {@code jti} of the current refresh token of the session; a refresh token with another ID
 *                  is an old one. A session that waits for the exchange of its login code has no refresh token yet:
 *                  its token ID is one that no token holds.
 * @param codeId    the claim {@code jti} of the login code that opens the session, until the exchange of the login
 *                  code uses it; {@code null} for a session that no login code opens, and for a session whose login
 *                  code was used. It is no secret: it gives no access without the signature of core, and the record
 *                  holds neither the login code nor the hash of the login verifier.
 * @param startedAt the time of the login
 * @param endsAt    the end of the session, 24 hours after its start; a refresh does not move it
 */
@Document(SessionRecord.COLLECTION)
record SessionRecord(@Id String id, String tenantId, String userId, String tokenId, String codeId,
		Instant startedAt, Instant endsAt) implements TenantDocument {

	static final String COLLECTION = "sessions";

	static final String ID = "_id";

	static final String TOKEN_ID = "tokenId";

	static final String CODE_ID = "codeId";

	static final String ENDS_AT = "endsAt";

}
