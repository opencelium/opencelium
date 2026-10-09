package io.opencelium.core.secrets.keys;

import java.util.Optional;

import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.Repository;

/** Reads for the startup checks. The secret store adds the writes. */
public interface WrappedDekRepository extends Repository<WrappedDek, String> {

	/** Whether this database holds any wrapped data key, of any tenant: the generation guard. */
	@Query(value = "{}", exists = true)
	boolean existsAny();

	/** The oldest wrapped data key: the startup canary. */
	Optional<WrappedDek> findFirstByOrderByCreatedAtAsc();

}
