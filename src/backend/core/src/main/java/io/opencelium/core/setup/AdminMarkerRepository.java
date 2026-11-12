package io.opencelium.core.setup;

import java.util.Optional;

import org.springframework.data.repository.Repository;

/**
 * The admin markers, by tenant ID. The first start reads the marker of its tenant and deletes it after the admin
 * exists; a delete of a marker that another process deleted first changes nothing.
 */
public interface AdminMarkerRepository extends Repository<AdminMarkerDocument, String> {

	Optional<AdminMarkerDocument> findById(String tenantId);

	void deleteById(String tenantId);

}
