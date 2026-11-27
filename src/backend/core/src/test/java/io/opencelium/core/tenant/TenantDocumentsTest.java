package io.opencelium.core.tenant;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.TenantTasks;
import io.opencelium.core.testsupport.fixture.TestDocument;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The tenant-document access limits each operation to the current tenant. In the self-host mode the 1 database holds
 * the documents of 2 tenant IDs: the test writes them with the plain template, then reads, changes and deletes them
 * through the access for the self-host tenant, also with the read and delete in 1 operation. A document of the other
 * tenant stays as it is.
 */
@MongoIntegrationTest
class TenantDocumentsTest {

	private static final String OWN = TenantId.SELF_HOST.value();

	private static final String OTHER = "other";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, TenantDocumentsTest.class, () -> dataDir);
	}

	@Autowired
	TenantDocuments documents;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	MongoTemplate mongo;

	@BeforeEach
	void removeDocuments() {
		mongo.dropCollection(TestDocument.class);
	}

	@Test
	void findOneGivesNoDocumentWhenTheDocumentIsOfAnotherTenant() {
		store(OTHER, "shared");

		Optional<TestDocument> found = asSelfHost(() -> documents.findOne(TestDocument.class, named("shared")));

		assertThat(found).isEmpty();
	}

	@Test
	void findGivesOnlyTheDocumentsOfTheCurrentTenantWhenTwoTenantsHaveDocuments() {
		store(OWN, "a");
		store(OTHER, "b");
		store(OWN, "c");

		List<TestDocument> found = asSelfHost(() -> documents.find(TestDocument.class, new Criteria()));

		assertThat(found).extracting(TestDocument::name).containsExactlyInAnyOrder("a", "c");
		assertThat(found).extracting(TestDocument::tenantId).containsOnly(OWN);
	}

	@Test
	void countIgnoresTheDocumentsOfAnotherTenantWhenTheConditionMatchesThem() {
		store(OWN, "x");
		store(OTHER, "x");
		store(OTHER, "x");

		long count = asSelfHost(() -> documents.count(TestDocument.class, named("x")));

		assertThat(count).isEqualTo(1);
	}

	@Test
	void updateChangesNoDocumentOfAnotherTenantWhenTheConditionMatchesIt() {
		store(OWN, "x");
		store(OTHER, "x");

		long changed = asSelfHost(
				() -> documents.update(TestDocument.class, named("x"), new Update().set(TestDocument.NUMBER, 7)));

		assertThat(changed).isEqualTo(1);
		assertThat(storedOf(OWN)).extracting(TestDocument::number).containsExactly(7);
		assertThat(storedOf(OTHER)).extracting(TestDocument::number).containsExactly(0);
	}

	@Test
	void deleteRemovesNoDocumentOfAnotherTenantWhenTheConditionMatchesIt() {
		store(OWN, "x");
		store(OTHER, "x");

		long deleted = asSelfHost(() -> documents.delete(TestDocument.class, named("x")));

		assertThat(deleted).isEqualTo(1);
		assertThat(storedOf(OWN)).isEmpty();
		assertThat(storedOf(OTHER)).hasSize(1);
	}

	@Test
	void findAndDeleteGivesAndDeletesTheDocumentOfTheCurrentTenantWhenTheConditionMatchesIt() {
		store(OWN, "x");
		store(OTHER, "x");

		Optional<TestDocument> taken = asSelfHost(() -> documents.findAndDelete(TestDocument.class, named("x")));

		assertThat(taken).hasValueSatisfying(document -> {
			assertThat(document.tenantId()).isEqualTo(OWN);
			assertThat(document.name()).isEqualTo("x");
		});
		assertThat(storedOf(OWN)).isEmpty();
		assertThat(storedOf(OTHER)).hasSize(1);
	}

	@Test
	void findAndDeleteGivesAndDeletesNoDocumentOfAnotherTenantWhenTheConditionMatchesIt() {
		store(OTHER, "x");

		Optional<TestDocument> taken = asSelfHost(() -> documents.findAndDelete(TestDocument.class, named("x")));

		assertThat(taken).isEmpty();
		assertThat(storedOf(OTHER)).hasSize(1);
	}

	@Test
	void findAndDeleteGivesNoDocumentWhenItIsTheSecondCallForTheDocument() {
		store(OWN, "x");
		Optional<TestDocument> first = asSelfHost(() -> documents.findAndDelete(TestDocument.class, named("x")));

		Optional<TestDocument> second = asSelfHost(() -> documents.findAndDelete(TestDocument.class, named("x")));

		assertThat(first).as("the document of the first call").isPresent();
		assertThat(second).as("the document of the second call").isEmpty();
	}

	@Test
	void insertStoresTheDocumentWhenItHoldsTheCurrentTenant() {
		TestDocument inserted = asSelfHost(() -> documents.insert(TestDocument.of(OWN, "new")));

		assertThat(inserted.id()).isNotNull();
		assertThat(storedOf(OWN)).singleElement().satisfies(stored -> {
			assertThat(stored.id()).isEqualTo(inserted.id());
			assertThat(stored.name()).isEqualTo("new");
		});
	}

	@Test
	void insertStopsWhenTheDocumentHoldsAnotherTenant() {
		assertThatIllegalArgumentException()
				.isThrownBy(() -> asSelfHost(() -> documents.insert(TestDocument.of(OTHER, "new"))))
				.withMessageContaining("'" + OTHER + "'").withMessageContaining("'" + OWN + "'");
		assertThat(mongo.count(new Query(), TestDocument.class)).isZero();
	}

	@Test
	void insertStopsWhenTheDocumentHoldsNoTenant() {
		assertThatIllegalArgumentException()
				.isThrownBy(() -> asSelfHost(() -> documents.insert(TestDocument.of(null, "new"))))
				.withMessageContaining("no tenant");
		assertThat(mongo.count(new Query(), TestDocument.class)).isZero();
	}

	@Test
	void updateStopsWhenTheChangeNamesTheFieldTenantId() {
		store(OWN, "x");

		assertThatIllegalArgumentException()
				.isThrownBy(() -> asSelfHost(() -> documents.update(TestDocument.class, named("x"),
						new Update().set(TenantDocument.TENANT_ID, OTHER))))
				.withMessageContaining(TenantDocument.TENANT_ID);
		assertThat(storedOf(OWN)).hasSize(1);
		assertThat(storedOf(OTHER)).isEmpty();
	}

	@Test
	void updateStopsWhenTheChangeRenamesAFieldToTenantId() {
		// A rename names its new field only in its value; the tenant ID would take the value of the old field.
		mongo.insert(new Document(TenantDocument.TENANT_ID, OWN).append(TestDocument.NAME, "x")
				.append(TestDocument.NUMBER, 0).append("legacyTenant", OTHER), TestDocument.COLLECTION);

		assertThatIllegalArgumentException()
				.isThrownBy(() -> asSelfHost(() -> documents.update(TestDocument.class, named("x"),
						new Update().rename("legacyTenant", TenantDocument.TENANT_ID))))
				.withMessageContaining(TenantDocument.TENANT_ID);
		assertThat(storedOf(OWN)).hasSize(1);
		assertThat(storedOf(OTHER)).isEmpty();
	}

	@ParameterizedTest
	@MethodSource("changesThatNameTenantIdInAPlainMap")
	void updateStopsWhenAChangeFromADocumentNamesTenantIdInAPlainMap(Update change) {
		// A change made from a document can hold a plain map in place of a BSON document for its operator.
		mongo.insert(new Document(TenantDocument.TENANT_ID, OWN).append(TestDocument.NAME, "x")
				.append(TestDocument.NUMBER, 0).append("legacyTenant", OTHER), TestDocument.COLLECTION);

		assertThatIllegalArgumentException()
				.isThrownBy(() -> asSelfHost(() -> documents.update(TestDocument.class, named("x"), change)))
				.withMessageContaining(TenantDocument.TENANT_ID);
		assertThat(storedOf(OWN)).hasSize(1);
		assertThat(storedOf(OTHER)).isEmpty();
	}

	static Stream<Update> changesThatNameTenantIdInAPlainMap() {
		return Stream.of(Update.fromDocument(new Document("$set", Map.of(TenantDocument.TENANT_ID, OTHER))),
				Update.fromDocument(new Document("$rename", Map.of("legacyTenant", TenantDocument.TENANT_ID))));
	}

	@Test
	void findStopsBeforeAQueryWhenNoTenantIsBound() {
		// MongoDB refuses this condition, so an operation that sends the query ends with the error of the server.
		Criteria refusedByTheServer = where(TestDocument.NAME).is(new Document("$noSuchOperator", 1));
		assertThatExceptionOfType(DataAccessException.class)
				.isThrownBy(() -> mongo.find(new Query(refusedByTheServer), TestDocument.class));

		assertThatExceptionOfType(NoCurrentTenantException.class)
				.isThrownBy(() -> documents.find(TestDocument.class, refusedByTheServer));
	}

	@Test
	void findAndDeleteStopsBeforeAQueryWhenNoTenantIsBound() {
		// MongoDB refuses this condition, so an operation that sends the query ends with the error of the server.
		Criteria refusedByTheServer = where(TestDocument.NAME).is(new Document("$noSuchOperator", 1));
		assertThatExceptionOfType(DataAccessException.class)
				.isThrownBy(() -> mongo.findAndRemove(new Query(refusedByTheServer), TestDocument.class));

		assertThatExceptionOfType(NoCurrentTenantException.class)
				.isThrownBy(() -> documents.findAndDelete(TestDocument.class, refusedByTheServer));
	}

	private <T> T asSelfHost(Supplier<T> step) {
		return TenantTasks.call(tenantRunner, TenantId.SELF_HOST, step);
	}

	private static Criteria named(String name) {
		return where(TestDocument.NAME).is(name);
	}

	/** Writes with the plain template, without the access: the test data of 2 tenants. */
	private void store(String tenantId, String name) {
		mongo.insert(TestDocument.of(tenantId, name));
	}

	/** Reads with the plain template, without the access. */
	private List<TestDocument> storedOf(String tenantId) {
		return mongo.find(new Query(where(TenantDocument.TENANT_ID).is(tenantId)), TestDocument.class);
	}

}
