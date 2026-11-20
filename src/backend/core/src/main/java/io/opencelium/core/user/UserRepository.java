package io.opencelium.core.user;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import io.opencelium.core.tenant.TenantDocuments;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The users collection, limited to the users of the current tenant: each operation goes through the tenant-document
 * access, so a user of another tenant looks like a user that does not exist. Changes to existing users are single
 * conditional updates rather than read-modify-save, so the lock job and a password change running at the same time
 * cannot overwrite each other.
 */
@Repository
class UserRepository {

	private final TenantDocuments documents;

	UserRepository(TenantDocuments documents) {
		this.documents = documents;
	}

	/**
	 * @return the stored user with its new ID
	 * @throws IllegalArgumentException when the user is not of the current tenant
	 */
	UserDocument insert(UserDocument user) {
		return documents.insert(user);
	}

	/** The user with exactly this username: the comparison respects upper case and lower case. */
	Optional<UserDocument> findByUsername(String username) {
		return documents.findOne(UserDocument.class, where(UserDocument.USERNAME).is(username));
	}

	Optional<UserDocument> findById(String id) {
		return documents.findOne(UserDocument.class, where(UserDocument.ID).is(id));
	}

	boolean existsWithRole(String role) {
		return documents.findOne(UserDocument.class, where(UserDocument.ROLES).is(role)).isPresent();
	}

	boolean existsAny() {
		return documents.findOne(UserDocument.class, new Criteria()).isPresent();
	}

	/** Unlocked users whose generated password was issued before {@code cutoff} and is still unchanged. */
	List<UserDocument> findAllGeneratedUnchangedBefore(Instant cutoff) {
		return documents.find(UserDocument.class, generatedUnchangedBefore(cutoff));
	}

	/** Locks the user if its generated password is still the one issued before {@code cutoff}; 1 if locked. */
	long lockIfGeneratedUnchangedBefore(String id, Instant cutoff) {
		return documents.update(UserDocument.class, generatedUnchangedBefore(cutoff).and(UserDocument.ID).is(id),
				new Update().set(UserDocument.LOCKED, true));
	}

	/** Sets a password the user chose, which also unlocks the user; 1 if the user exists. */
	long setChosenPassword(String id, String passwordHash, Instant issuedAt) {
		return documents.update(UserDocument.class, where(UserDocument.ID).is(id),
				new Update().set(UserDocument.PASSWORD_HASH, passwordHash)
						.set(UserDocument.PASSWORD_ISSUED_AT, issuedAt).set(UserDocument.MUST_CHANGE_PASSWORD, false)
						.set(UserDocument.LOCKED, false));
	}

	private static Criteria generatedUnchangedBefore(Instant cutoff) {
		return where(UserDocument.MUST_CHANGE_PASSWORD).is(true).and(UserDocument.LOCKED).is(false)
				.and(UserDocument.PASSWORD_ISSUED_AT).lt(cutoff);
	}

}
