package io.opencelium.buildrules;

import org.springframework.data.repository.Repository;

/** Breaks the rule for the tenant documents: a repository interface of Spring Data that the rule does not name. */
interface UnnamedRepository extends Repository<PasswordHashDocument, String> {

}
