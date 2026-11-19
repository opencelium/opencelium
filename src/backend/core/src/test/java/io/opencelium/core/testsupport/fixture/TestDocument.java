package io.opencelium.core.testsupport.fixture;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import io.opencelium.core.tenant.TenantDocument;

/**
 * A tenant document of no feature, in a collection of its own, for the tests of the tenant-document access. A test
 * writes it for 2 tenants with the plain template, then reads, changes and deletes it through the access.
 *
 * @param name   what a test condition matches
 * @param number what a test change sets
 */
@Document(TestDocument.COLLECTION)
public record TestDocument(@Id String id, String tenantId, String name, int number) implements TenantDocument {

	public static final String COLLECTION = "test_documents";

	public static final String NAME = "name";

	public static final String NUMBER = "number";

	/** A new document without an ID and with the number 0. */
	public static TestDocument of(String tenantId, String name) {
		return new TestDocument(null, tenantId, name, 0);
	}

}
