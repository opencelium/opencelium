package io.opencelium.buildrules;

import org.springframework.data.repository.RepositoryDefinition;

/**
 * Breaks the rule for the tenant documents: a repository of Spring Data that the annotation declares, not the
 * repository interface, and that the rule does not name.
 */
@RepositoryDefinition(domainClass = PasswordHashDocument.class, idClass = String.class)
interface RepositoryDefinitionSample {

	long count();

}
