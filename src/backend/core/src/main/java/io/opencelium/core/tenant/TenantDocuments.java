package io.opencelium.core.tenant;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
public final class TenantDocuments {

	public <T extends TenantDocument> Optional<T> findOne(Class<T> type, Criteria condition) {
		throw new UnsupportedOperationException();
	}

	public <T extends TenantDocument> List<T> find(Class<T> type, Criteria condition) {
		throw new UnsupportedOperationException();
	}

	public long count(Class<? extends TenantDocument> type, Criteria condition) {
		throw new UnsupportedOperationException();
	}

	public <T extends TenantDocument> T insert(T document) {
		throw new UnsupportedOperationException();
	}

	public long update(Class<? extends TenantDocument> type, Criteria condition, Update change) {
		throw new UnsupportedOperationException();
	}

	public long delete(Class<? extends TenantDocument> type, Criteria condition) {
		throw new UnsupportedOperationException();
	}

}
