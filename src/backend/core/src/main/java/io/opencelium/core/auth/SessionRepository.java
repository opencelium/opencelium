package io.opencelium.core.auth;

import java.util.Optional;

import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import io.opencelium.core.tenant.TenantDocuments;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The sessions collection, limited to the sessions of the current tenant: each operation goes through the
 * tenant-document access. The change of the current refresh token and the use of a login code are each 1 conditional
 * update, so that of 2 refreshes with 1 refresh token, or of 2 exchanges of 1 login code, at the same time only 1
 * succeeds.
 */
@Repository
class SessionRepository {

	private final TenantDocuments documents;

	SessionRepository(TenantDocuments documents) {
		this.documents = documents;
	}

	/**
	 * @throws IllegalArgumentException when the session is not of the current tenant
	 */
	void insert(SessionRecord session) {
		documents.insert(session);
	}

	Optional<SessionRecord> findById(String sessionId) {
		return documents.findOne(SessionRecord.class, where(SessionRecord.ID).is(sessionId));
	}

	/**
	 * Replaces the token ID of the current refresh token, if it is still {@code currentTokenId}.
	 *
	 * @return {@code true} when this call replaced it; {@code false} when the session does not exist or has another
	 *         token ID
	 */
	boolean replaceTokenId(String sessionId, String currentTokenId, String newTokenId) {
		return documents.update(SessionRecord.class,
				where(SessionRecord.ID).is(sessionId).and(SessionRecord.TOKEN_ID).is(currentTokenId),
				new Update().set(SessionRecord.TOKEN_ID, newTokenId)) == 1;
	}

	/**
	 * Uses the login code of the session: clears its code ID, if it is still {@code codeId}.
	 *
	 * @return {@code true} when this call used the login code; {@code false} when the session does not exist or has
	 *         another code ID, which means that another exchange used the login code first
	 */
	boolean useLoginCode(String sessionId, String codeId) {
		return documents.update(SessionRecord.class,
				where(SessionRecord.ID).is(sessionId).and(SessionRecord.CODE_ID).is(codeId),
				new Update().unset(SessionRecord.CODE_ID)) == 1;
	}

	/** Deletes the session; a session that does not exist is no error. */
	void delete(String sessionId) {
		documents.delete(SessionRecord.class, where(SessionRecord.ID).is(sessionId));
	}

}
