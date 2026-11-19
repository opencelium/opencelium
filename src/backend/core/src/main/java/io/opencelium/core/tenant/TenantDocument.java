package io.opencelium.core.tenant;

/**
 * A database document that belongs to exactly 1 tenant, for example an OpenCelium user. Its collection holds the
 * tenant ID in the field {@value #TENANT_ID}. Core reads, writes and deletes such a document only through
 * {@link TenantDocuments}, which limits each operation to the current tenant.
 */
public interface TenantDocument {

	/** The field of the tenant ID in each collection of tenant documents. */
	String TENANT_ID = "tenantId";

	/** The ID of the tenant that owns this document. */
	String tenantId();

}
