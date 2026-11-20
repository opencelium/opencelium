package io.opencelium.core.auth;

import java.util.Optional;

import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import io.opencelium.core.tenant.TenantDocuments;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The sessions collection, limited to the sessions of the current tenant: each operation goes through the
 * tenant-document access. The change of the current refresh token is 1 conditional update, so that of 2 refreshes
 * with 1 refresh token at the same time only 1 changes it.
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

	/** Deletes the session; a session that does not exist is no error. */
	void delete(String sessionId) {
		documents.delete(SessionRecord.class, where(SessionRecord.ID).is(sessionId));
	}

}
