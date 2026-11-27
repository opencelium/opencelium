package io.opencelium.core.auth;

import org.springframework.stereotype.Repository;

import io.opencelium.core.tenant.TenantDocuments;

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

}
