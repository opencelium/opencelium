package io.opencelium.core.auth;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import io.opencelium.core.tenant.TenantDocuments;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The login records of the OIDC logins, limited to the login records of the current tenant: each operation goes
 * through the tenant-document access.
 */
@Repository
class OidcLoginRepository {

	private final TenantDocuments documents;

	OidcLoginRepository(TenantDocuments documents) {
		this.documents = documents;
	}

	/**
	 * @throws IllegalArgumentException when the login record is not of the current tenant
	 */
	void insert(OidcLoginRecord login) {
		documents.insert(login);
	}

	/**
	 * Reads and deletes the login record of the state, in 1 operation of the database: of 2 answers with the same
	 * state, only 1 gets the login record. A login record of another OIDC provider is not the record of the state, and
	 * it stays.
	 *
	 * @param providerId the provider ID of the OIDC provider whose redirect URI the IdP answered at
	 * @param state      the state of the answer of the IdP
	 * @return the deleted login record, or nothing when the current tenant has no login record of the OIDC provider
	 *         with this state
	 */
	Optional<OidcLoginRecord> take(String providerId, String state) {
		return documents.findAndDelete(OidcLoginRecord.class,
				where(OidcLoginRecord.STATE).is(state).and(OidcLoginRecord.PROVIDER_ID).is(providerId));
	}

}
