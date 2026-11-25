package io.opencelium.core;

import java.security.Key;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.Signature;
import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import com.mongodb.client.MongoCluster;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaAccess;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.domain.JavaField;
import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.core.domain.JavaParameterizedType;
import com.tngtech.archunit.core.domain.JavaType;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.AbstractClassesTransformer;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ClassesTransformer;
import com.tngtech.archunit.lang.EvaluationResult;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.ExecutableAggregationOperation;
import org.springframework.data.mongodb.core.ExecutableFindOperation;
import org.springframework.data.mongodb.core.ExecutableInsertOperation;
import org.springframework.data.mongodb.core.ExecutableMapReduceOperation;
import org.springframework.data.mongodb.core.ExecutableRemoveOperation;
import org.springframework.data.mongodb.core.ExecutableUpdateOperation;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.convert.ReferenceLoader;
import org.springframework.data.mongodb.core.convert.ReferenceResolver;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.RepositoryDefinition;

import io.opencelium.core.secrets.keys.DekAccess;
import io.opencelium.core.secrets.keys.DekWrapper;
import io.opencelium.core.secrets.keys.RootKey;

import static com.tngtech.archunit.base.DescribedPredicate.describe;
import static com.tngtech.archunit.base.DescribedPredicate.not;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.assignableTo;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.equivalentTo;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage;
import static com.tngtech.archunit.lang.conditions.ArchConditions.haveNameMatching;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.all;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * The 5 build rules of core: each rule passes on the classes of core, and fails on a sample class that breaks it; the
 * report of a failure names the rule and the class. The samples are in the test package {@code io.opencelium.buildrules}
 * and not in the package of the code that they break: in {@code io.opencelium.core}, the repository scan of Spring
 * Boot would make a bean of the sample repository interface in each full-application test.
 */
class BuildRulesTest {

	private static final JavaClasses CORE = new ClassFileImporter()
		.withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
		.importPackages("io.opencelium.core");

	private static final String SAMPLES = "io.opencelium.buildrules.";

	/** Rule 1: a configuration value is a bootstrap property or a runtime setting, never a field from the yml file. */
	static final ArchRule NO_VALUE_ANNOTATION = noClasses().should()
		.dependOnClassesThat()
		.haveFullyQualifiedName("org.springframework.beans.factory.annotation.Value")
		.as("No class uses @Value");

	/**
	 * The types that hold or give the bytes of a key: those of the JDK and of the libraries, and the root key, the DEK
	 * access and the DEK wrapper of core.secrets.keys, which give the bytes of the root key and of a DEK.
	 */
	private static final DescribedPredicate<JavaClass> KEY_MATERIAL = resideInAnyPackage("javax.crypto..",
			"com.nimbusds.jose.crypto..", "com.nimbusds.jose.jwk..", "com.nimbusds.jose.proc..", "com.nimbusds.jwt.proc..",
			"org.springframework.security.crypto.encrypt..")
		.or(assignableTo("com.nimbusds.jose.JWSSigner"))
		.or(assignableTo("com.nimbusds.jose.JWSVerifier"))
		.or(assignableTo("com.nimbusds.jose.JWEEncrypter"))
		.or(assignableTo("com.nimbusds.jose.JWEDecrypter"))
		.or(assignableTo(Key.class))
		.or(equivalentTo(KeyPair.class))
		.or(equivalentTo(KeyFactory.class))
		.or(equivalentTo(KeyPairGenerator.class))
		.or(equivalentTo(KeyStore.class))
		.or(equivalentTo(Signature.class))
		.or(assignableTo(RootKey.class))
		.or(assignableTo(DekAccess.class))
		.or(assignableTo(DekAccess.DekUse.class))
		.or(assignableTo(DekWrapper.class))
		.as("key material: javax.crypto, the JOSE keys, signers, verifiers, encrypters, decrypters and processors, the"
				+ " encryptors of Spring Security, a key type or the key pair of java.security, or the root key, the"
				+ " DEK access and the DEK wrapper of core.secrets.keys");

	/** Rule 2: only core.secrets holds key material; a password hash and a random value are no key material. */
	static final ArchRule CRYPTOGRAPHY_ONLY_IN_SECRETS = noClasses().that()
		.resideOutsideOfPackage("io.opencelium.core.secrets..")
		.should()
		.dependOnClassesThat(KEY_MATERIAL)
		.as("Cryptography with key material only in core.secrets");

	private static final List<String> SECRET_WORDS = List.of("password", "secret", "token", "credential", "apikey",
			"privatekey", "passphrase");

	private static final String TENANT_DOCUMENT = "io.opencelium.core.tenant.TenantDocument";

	/**
	 * The main code of each module on the classpath: an implementation of an interface of a stored field can be in
	 * another module than core, and the import of core does not hold it.
	 */
	private static final JavaClasses OWN_CODE = new ClassFileImporter()
		.withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
		.importPackages("io.opencelium");

	/**
	 * The fields that MongoDB stores: the instance fields of each {@code @Document} class and of each tenant document,
	 * also without the annotation, of their superclasses, of their subclasses, and of each type of this code base that
	 * they embed, also as an element of a collection, a map or an array. Spring Data stores the fields of the class of
	 * the value, so an interface or an abstract class in a field stores the fields of each of its implementations. A
	 * static field is not stored, for example the constant with the name of a stored field.
	 */
	private static final ClassesTransformer<JavaField> STORED_FIELDS = new AbstractClassesTransformer<>(
			"stored fields") {

		@Override
		public Iterable<JavaField> doTransform(JavaClasses classes) {
			Map<String, JavaClass> stored = new LinkedHashMap<>();
			Deque<JavaClass> open = new ArrayDeque<>();
			classes.stream()
				.filter(type -> type.isAnnotatedWith(Document.class) || type.isAssignableTo(TENANT_DOCUMENT))
				.forEach(open::add);
			while (!open.isEmpty()) {
				JavaClass type = open.pop();
				if (!stored.containsKey(type.getName())) {
					JavaClass withFields = withFields(type);
					stored.put(withFields.getName(), withFields);
					withFields.getRawSuperclass().filter(BuildRulesTest::isOwnCode).ifPresent(open::add);
					subtypes(type).filter(BuildRulesTest::isOwnCode).forEach(open::add);
					storedFields(withFields).forEach(field -> field.getType()
						.getAllInvolvedRawTypes()
						.stream()
						.map(JavaClass::getBaseComponentType)
						.filter(BuildRulesTest::isOwnCode)
						.forEach(open::add));
				}
			}
			return stored.values().stream().flatMap(type -> storedFields(type).stream()).toList();
		}

	};

	private static final DescribedPredicate<JavaField> TEXT_OR_BYTES = describe(
			"hold text or bytes, alone or in a collection, a map, an array or an optional value",
			field -> holdsText(field.getType()));

	private static final DescribedPredicate<JavaField> SECRET_WORD = describe("have a secret word in their name",
			field -> SECRET_WORDS.stream().anyMatch(field.getName().toLowerCase(Locale.ROOT)::contains));

	/** Rule 3: a document keeps a secret only as a secret reference; a hash and an ID hold no secret. */
	static final ArchRule SECRET_FIELDS = all(STORED_FIELDS).that(TEXT_OR_BYTES)
		.and(SECRET_WORD)
		.should(haveNameMatching(".*(Hash|Id)"))
		.as("No plaintext secret-named field in a stored document")
		.allowEmptyShould(true);

	private static final String SETTINGS = "io.opencelium.core.settings.";

	/** Rule 4: the settings service is the only reader and writer of the settings collection. */
	static final ArchRule SETTINGS_ONLY_THROUGH_THE_SERVICE = noClasses().that()
		.doNotHaveFullyQualifiedName(SETTINGS + "SettingsService")
		.and()
		.doNotHaveFullyQualifiedName(SETTINGS + "SettingsConfig")
		.and()
		.doNotHaveFullyQualifiedName(SETTINGS + "SettingsRepository")
		.should()
		.dependOnClassesThat()
		.haveFullyQualifiedName(SETTINGS + "SettingsRepository")
		.as("The settings collection only through the settings service");

	/**
	 * The classes outside the rule for the tenant documents: the tenant-document access itself, the MongoDB connection,
	 * which reads no document, the classes of the data of the installation, which belongs to no tenant, and the 3
	 * operations of the start that read without a tenant. Each class here keeps only that data: a tenant document that
	 * one of them gets goes through the tenant-document access.
	 */
	private static final Set<String> OUTSIDE_THE_TENANT_RULE = Set.of(
			// the tenant-document access
			"io.opencelium.core.tenant.TenantDocuments",
			// the MongoDB connection: the client, the factory of the clients and the startup ping
			"io.opencelium.core.config.mongo.MongoConfig", "io.opencelium.core.config.mongo.MongoClientFactory",
			"io.opencelium.core.config.mongo.MongoStartupPing",
			// the data of the installation
			"io.opencelium.core.settings.SettingsRepository", "io.opencelium.core.secrets.MongoSecretStorage",
			"io.opencelium.core.secrets.keys.DekAccess",
			// the start checks of the root key and the signing-key loader
			"io.opencelium.core.secrets.keys.WrappedDekRepository", "io.opencelium.core.secrets.keys.SigningKeyLoader",
			// the setup wizard with its own MongoDB client, and the admin marker of the completion runner
			"io.opencelium.core.user.AdminLookup", "io.opencelium.core.secrets.keys.WrappedDekProbe",
			"io.opencelium.core.setup.AdminMarker", "io.opencelium.core.setup.AdminMarkerRepository");

	private static final DescribedPredicate<JavaClass> NAMED = describe("are named outside the rule",
			type -> OUTSIDE_THE_TENANT_RULE.contains(type.getName().replaceFirst("\\$.*", "")));

	/**
	 * The Mongo template, its fluent operations and its bulk operations. A fluent operation is a supertype of the
	 * template, and Spring gives the template bean to a field of that type.
	 */
	private static final DescribedPredicate<JavaClass> TEMPLATE_TYPES = assignableTo(MongoOperations.class)
		.or(assignableTo(ExecutableFindOperation.class))
		.or(assignableTo(ExecutableInsertOperation.class))
		.or(assignableTo(ExecutableUpdateOperation.class))
		.or(assignableTo(ExecutableRemoveOperation.class))
		.or(assignableTo(ExecutableAggregationOperation.class))
		.or(assignableTo(ExecutableMapReduceOperation.class))
		.or(assignableTo(BulkOperations.class));

	/** The template types and the types nested in them, for example the terminating find of a fluent query. */
	private static final DescribedPredicate<JavaClass> TEMPLATE = TEMPLATE_TYPES.or(describe(
			"a type nested in the template", type -> type.getEnclosingClass().filter(TEMPLATE_TYPES).isPresent()));

	/**
	 * A call of a method or a constructor of the template, or a method reference to it; the index operations read and
	 * write no document.
	 */
	private static final DescribedPredicate<JavaAccess<?>> TEMPLATE_ACCESS = describe(
			"a method or a constructor of the Mongo template other than the index operations",
			access -> TEMPLATE.test(access.getTargetOwner()) && !"indexOps".equals(access.getName()));

	private static final DescribedPredicate<JavaClass> DRIVER = assignableTo(MongoCollection.class)
		.or(assignableTo(MongoDatabase.class))
		.or(assignableTo(MongoCluster.class))
		.as("a collection, a database or a client of the MongoDB driver");

	/**
	 * The classes of Spring Data MongoDB that read or write a collection for a class that gives them the template or
	 * the database factory: the repository support, the message listeners of the change streams, GridFS, and the
	 * readers of a referenced document. The database factory itself gives each database of the driver by its name.
	 */
	private static final DescribedPredicate<JavaClass> SPRING_DATA_READERS = resideInAnyPackage(
			"org.springframework.data.mongodb.repository..", "org.springframework.data.mongodb.core.messaging..",
			"org.springframework.data.mongodb.gridfs..")
		.or(assignableTo(ReferenceResolver.class))
		.or(assignableTo(ReferenceLoader.class))
		.or(assignableTo(MongoDatabaseFactory.class))
		.as("a repository, a message listener, GridFS, a reference reader or the database factory of Spring Data"
				+ " MongoDB");

	/**
	 * Rule 5: a repository reads and writes a tenant document only through the tenant-document access. No other class
	 * calls a method or a constructor of the Mongo template other than the index operations, also through a method
	 * reference, uses the MongoDB driver or another reader of Spring Data MongoDB, or is a repository of Spring Data.
	 */
	static final ArchRule TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS = noClasses().that(not(NAMED))
		.should()
		.accessTargetWhere(TEMPLATE_ACCESS)
		.orShould()
		.dependOnClassesThat(DRIVER)
		.orShould()
		.dependOnClassesThat(SPRING_DATA_READERS)
		.orShould()
		.beAssignableTo(Repository.class)
		.orShould()
		.beAnnotatedWith(RepositoryDefinition.class)
		.as("Tenant documents only through the tenant-document access");

	@Test
	void noValueAnnotationPassesWhenTheCodeOfCoreIsImported() {
		NO_VALUE_ANNOTATION.check(CORE);
	}

	@Test
	void noValueAnnotationFailsWhenAClassUsesValue() {
		assertFails(NO_VALUE_ANNOTATION, SAMPLES + "ValueSample");
	}

	@Test
	void cryptographyOnlyInSecretsPassesWhenTheCodeOfCoreIsImported() {
		CRYPTOGRAPHY_ONLY_IN_SECRETS.check(CORE);
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideUsesACipher() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "CipherSample");
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideUsesAKeyType() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "KeyTypeSample");
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideHoldsAKeyPair() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "KeyPairSample");
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideSignsWithAJoseSigner() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "JoseSignerSample");
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideUsesAnEncryptorOfSpringSecurity() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "EncryptorSample");
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideUsesTheDekAccess() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "DekAccessSample");
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideImplementsAnOperationWithADek() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "DekUseSample");
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideUsesTheRootKey() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "RootKeySample");
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassOutsideMakesADekWrapper() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, SAMPLES + "DekWrapperSample");
	}

	@Test
	void cryptographyOnlyInSecretsPassesWhenAClassOutsideHashesAPassword() {
		CRYPTOGRAPHY_ONLY_IN_SECRETS.check(sample(SAMPLES + "PasswordHashSample"));
	}

	@Test
	void secretFieldsPassWhenTheCodeOfCoreIsImported() {
		SECRET_FIELDS.check(CORE);
	}

	@Test
	void secretFieldsFailWhenADocumentHasAPasswordText() {
		assertFails(SECRET_FIELDS, SAMPLES + "PasswordTextDocument");
	}

	@Test
	void secretFieldsFailWhenAnEmbeddedTypeHasAPasswordText() {
		assertFails(SECRET_FIELDS, SAMPLES + "EmbeddedPasswordDocument", SAMPLES + "EmbeddedPasswordDocument$Login");
	}

	@Test
	void secretFieldsFailWhenATypeEmbeddedInAnEmbeddedTypeHasAPasswordText() {
		assertFails(SECRET_FIELDS, SAMPLES + "DeepPasswordDocument", SAMPLES + "DeepPasswordDocument$Login");
	}

	@Test
	void secretFieldsFailWhenADocumentHasAMapOfCredentials() {
		assertFails(SECRET_FIELDS, SAMPLES + "CredentialMapDocument");
	}

	@Test
	void secretFieldsFailWhenATenantDocumentWithoutTheAnnotationHasAPasswordText() {
		assertFails(SECRET_FIELDS, SAMPLES + "UnannotatedTenantDocument");
	}

	@Test
	void secretFieldsFailWhenADocumentInheritsAPasswordText() {
		assertFails(SECRET_FIELDS, SAMPLES + "InheritedPasswordDocument", SAMPLES + "PasswordBase");
	}

	@Test
	void secretFieldsFailWhenAnImplementationOfAStoredInterfaceHasAPasswordText() {
		assertFails(SECRET_FIELDS, SAMPLES + "SealedCredentialDocument", SAMPLES + "SealedCredentialDocument$Basic");
	}

	@Test
	void secretFieldsPassWhenTheFieldIsAPasswordHash() {
		SECRET_FIELDS.check(sample(SAMPLES + "PasswordHashDocument"));
	}

	@Test
	void secretFieldsPassWhenTheFieldIsABoolean() {
		SECRET_FIELDS.check(sample(SAMPLES + "PasswordMarkDocument"));
	}

	@Test
	void secretFieldsPassWhenTheFieldIsASecretReference() {
		SECRET_FIELDS.check(sample(SAMPLES + "SecretReferenceDocument"));
	}

	@Test
	void settingsOnlyThroughTheServicePassesWhenTheCodeOfCoreIsImported() {
		SETTINGS_ONLY_THROUGH_THE_SERVICE.check(CORE);
	}

	@Test
	void settingsOnlyThroughTheServiceFailsWhenAnotherClassUsesTheSettingsRepository() {
		assertFails(SETTINGS_ONLY_THROUGH_THE_SERVICE, SETTINGS + "SettingsRepositoryUserSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessPassesWhenTheCodeOfCoreIsImported() {
		TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS.check(CORE);
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassCallsAReadOfTheTemplate() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "TemplateReadSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassUsesACollectionOfTheDriver() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "DriverCollectionSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassReadsTheChangesOfADatabase() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "ChangeStreamSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassWritesThroughTheClient() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "ClientBulkWriteSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassReadsThroughTheFluentTemplate() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "FluentTemplateSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassSavesThroughAMethodReference() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "MethodReferenceSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassWritesThroughTheBulkOperations() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "BulkOperationsSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassCompletesTheFluentQueryOfAnotherClass() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "FluentQuerySample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassReadsThroughTheRepositorySupport() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "RepositorySupportSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassStartsAMessageListener() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "MessageListenerSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassReadsThroughGridFs() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "GridFsSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassFetchesAReferencedDocument() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "ReferenceResolverSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassLoadsReferencedDocuments() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "ReferenceLoaderSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenAClassOpensADatabaseOfTheFactory() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "DatabaseFactorySample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenARepositoryInterfaceIsNotNamed() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "UnnamedRepository");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessFailsWhenARepositoryDefinitionIsNotNamed() {
		assertFails(TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS, SAMPLES + "RepositoryDefinitionSample");
	}

	@Test
	void tenantDocumentsOnlyThroughTheAccessPassesWhenAClassMakesAnIndex() {
		TENANT_DOCUMENTS_ONLY_THROUGH_THE_ACCESS.check(sample(SAMPLES + "IndexSample"));
	}

	/** The rule fails on the sample, and the report names the rule and the class. */
	private static void assertFails(ArchRule rule, String className) {
		assertFails(rule, className, className);
	}

	/**
	 * The rule fails on the sample, and the report names the rule and the class that breaks it, which can be another
	 * class than the sample, for example the superclass that declares a stored field.
	 */
	private static void assertFails(ArchRule rule, String className, String reportedClassName) {
		EvaluationResult result = rule.evaluate(sample(className));

		assertThat(result.hasViolation()).as("a violation of the rule").isTrue();
		assertThat(result.getFailureReport().toString()).contains(rule.getDescription()).contains(reportedClassName);
	}

	/** The sample class alone; a sample is package-private, so it is loaded by its name. */
	private static JavaClasses sample(String className) {
		try {
			return new ClassFileImporter().importClasses(Class.forName(className));
		}
		catch (ClassNotFoundException ex) {
			throw new IllegalStateException("The sample " + className + " does not exist.", ex);
		}
	}

	/** A type of this code base, which a document can embed; a type of the JDK or of a library is not examined. */
	private static boolean isOwnCode(JavaClass type) {
		return type.getPackageName().startsWith("io.opencelium.");
	}

	/**
	 * The type with its fields. An import resolves the types of the fields of an imported class, but a type further
	 * down stays a stub without fields, for example the type of a field of an embedded type of another package. Such a
	 * type is imported from its class file here, without the initialization of the class.
	 */
	private static JavaClass withFields(JavaClass type) {
		if (type.isFullyImported()) {
			return type;
		}
		try {
			return new ClassFileImporter()
				.importClass(Class.forName(type.getName(), false, BuildRulesTest.class.getClassLoader()));
		}
		catch (ClassNotFoundException ex) {
			throw new IllegalStateException("The stored type " + type.getName() + " is not on the classpath.", ex);
		}
	}

	/**
	 * The subclasses and the implementations of a stored type: those of the import that holds the type, and those of
	 * the main code of each module, for an implementation in another module than the type.
	 */
	private static Stream<JavaClass> subtypes(JavaClass type) {
		Stream<JavaClass> ownCode = OWN_CODE.contain(type.getName())
				? OWN_CODE.get(type.getName()).getAllSubclasses().stream() : Stream.empty();
		return Stream.concat(type.getAllSubclasses().stream(), ownCode);
	}

	/** The fields that MongoDB stores for the type: neither a static field nor a field that the compiler adds. */
	private static List<JavaField> storedFields(JavaClass type) {
		return type.getFields()
			.stream()
			.filter(field -> !field.getModifiers().contains(JavaModifier.STATIC)
					&& !field.getModifiers().contains(JavaModifier.SYNTHETIC))
			.toList();
	}

	/** Text or bytes, or a collection, an optional value or an array of them, or a map with them as values. */
	private static boolean holdsText(JavaType type) {
		JavaClass raw = type.toErasure();
		if (raw.isEquivalentTo(String.class) || raw.isEquivalentTo(char[].class) || raw.isEquivalentTo(byte[].class)) {
			return true;
		}
		if (raw.isArray()) {
			return holdsText(raw.getComponentType());
		}
		if (type instanceof JavaParameterizedType parameterized) {
			List<JavaType> arguments = parameterized.getActualTypeArguments();
			if (raw.isAssignableTo(Map.class) && arguments.size() == 2) {
				return holdsText(arguments.get(1));
			}
			if ((raw.isAssignableTo(Collection.class) || raw.isEquivalentTo(Optional.class)) && arguments.size() == 1) {
				return holdsText(arguments.get(0));
			}
		}
		return false;
	}

}
