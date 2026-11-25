package io.opencelium.core.authz;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.security.access.prepost.PreAuthorize;

/**
 * An endpoint method with this annotation, or each endpoint method of a controller class with it, needs the
 * permission rule {@link InstallationAdmin}. The method security of Spring Security examines the rule before the
 * method runs; a request that does not pass gets the status code 403. A feature names the rule with this annotation
 * and does not read a role itself.
 */
@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@" + AuthzConfig.INSTALLATION_ADMIN + ".check(authentication)")
public @interface InstallationAdminOnly {

}
