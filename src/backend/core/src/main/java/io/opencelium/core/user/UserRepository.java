package io.opencelium.core.user;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.data.repository.Repository;

/**
 * The users collection. Changes to existing users are single conditional updates rather than read-modify-save, so
 * the lock job and a password change running at the same time cannot overwrite each other.
 */
public interface UserRepository extends Repository<UserDocument, String> {

	<S extends UserDocument> S insert(S user);

	Optional<UserDocument> findById(String id);

	Optional<UserDocument> findByTenantIdAndUsername(String tenantId, String username);

	boolean existsByTenantIdAndRolesContaining(String tenantId, String role);

	/** Unlocked users whose generated password was issued before {@code cutoff} and is still unchanged. */
	@Query("{ 'mustChangePassword': true, 'locked': false, 'passwordIssuedAt': { '$lt': ?0 } }")
	List<UserDocument> findAllGeneratedUnchangedBefore(Instant cutoff);

	/** Locks the user if its generated password is still the one issued before {@code cutoff}; 1 if locked. */
	@Query("{ '_id': ?0, 'mustChangePassword': true, 'locked': false, 'passwordIssuedAt': { '$lt': ?1 } }")
	@Update("{ '$set': { 'locked': true } }")
	long lockIfGeneratedUnchangedBefore(String id, Instant cutoff);

	/** Sets a password the user chose, which also unlocks the user; 1 if the user exists. */
	@Query("{ '_id': ?0 }")
	@Update("{ '$set': { 'passwordHash': ?1, 'passwordIssuedAt': ?2, 'mustChangePassword': false, 'locked': false } }")
	long setChosenPassword(String id, String passwordHash, Instant issuedAt);

}
