package io.opencelium.worker;

import java.security.Key;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.Signature;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.EvaluationResult;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.assignableTo;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.equivalentTo;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The build rules of this module: no {@code @Value}, and no key material, because only the package core.secrets of
 * core holds key material. Each rule passes on the classes of the module and fails on a sample class that breaks it;
 * the report of a failure names the rule and the class.
 */
class BuildRulesTest {

	private static final JavaClasses MODULE = new ClassFileImporter()
		.withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
		.importPackages("io.opencelium.worker");

	static final ArchRule NO_VALUE_ANNOTATION = noClasses().should()
		.dependOnClassesThat()
		.haveFullyQualifiedName("org.springframework.beans.factory.annotation.Value")
		.as("No class uses @Value");

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
		.as("key material: javax.crypto, the JOSE keys, signers, verifiers, encrypters, decrypters and processors, the"
				+ " encryptors of Spring Security, or a key type or the key pair of java.security");

	static final ArchRule CRYPTOGRAPHY_ONLY_IN_SECRETS = noClasses().should()
		.dependOnClassesThat(KEY_MATERIAL)
		.as("Cryptography with key material only in core.secrets");

	@Test
	void noValueAnnotationPassesWhenTheCodeOfTheModuleIsImported() {
		NO_VALUE_ANNOTATION.check(MODULE);
	}

	@Test
	void noValueAnnotationFailsWhenAClassUsesValue() {
		assertFails(NO_VALUE_ANNOTATION, "io.opencelium.buildrules.ValueSample");
	}

	@Test
	void cryptographyOnlyInSecretsPassesWhenTheCodeOfTheModuleIsImported() {
		CRYPTOGRAPHY_ONLY_IN_SECRETS.check(MODULE);
	}

	@Test
	void cryptographyOnlyInSecretsFailsWhenAClassUsesACipher() {
		assertFails(CRYPTOGRAPHY_ONLY_IN_SECRETS, "io.opencelium.buildrules.CipherSample");
	}

	/** The rule fails on the sample, and the report names the rule and the class. */
	private static void assertFails(ArchRule rule, String className) {
		EvaluationResult result = rule.evaluate(sample(className));

		assertTrue(result.hasViolation(), "a violation of the rule");
		String report = result.getFailureReport().toString();
		assertTrue(report.contains(rule.getDescription()) && report.contains(className), report);
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

}
