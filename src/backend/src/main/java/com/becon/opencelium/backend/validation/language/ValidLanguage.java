package com.becon.opencelium.backend.validation.language;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Asserts that a value denotes one of the languages configured under {@code opencelium.language}.
 *
 * <p>A {@code null} or blank value passes: callers treat "not provided" as "use the configured
 * default" rather than as an error.
 */
@Documented
@Constraint(validatedBy = LanguageValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidLanguage {

    String message() default "Unsupported language";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
