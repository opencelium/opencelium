package com.becon.opencelium.backend.validation.file;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = MultipartFileValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface FileValidator {
    String message() default "File size must not exceed {maxSize} bytes";

    /**
     * Maximum allowed file size in bytes. Defaults to 10 MB.
     */
    long maxSize() default 10L * 1024 * 1024;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}