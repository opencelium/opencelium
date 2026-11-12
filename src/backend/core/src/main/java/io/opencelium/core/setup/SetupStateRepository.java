package io.opencelium.core.setup;

import java.util.Optional;

import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.data.repository.Repository;

/**
 * The setup state documents, by tenant ID. A change of the state is 1 conditional update, so 2 processes that start
 * at the same time cannot overwrite each other.
 */
public interface SetupStateRepository extends Repository<SetupStateDocument, String> {

	Optional<SetupStateDocument> findById(String tenantId);

	/**
	 * Turns the admin marker of a tenant into the state {@code REQUIRED} and removes the admin username, which belongs
	 * to the marker only.
	 *
	 * @return 1 when the tenant had the marker; 0 when another process was first
	 */
	@Query("{ '_id': ?0, 'state': 'PENDING_ADMIN' }")
	@Update("{ '$set': { 'state': 'REQUIRED' }, '$unset': { 'adminUsername': '' } }")
	long requireAfterAdmin(String tenantId);

}
