/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.annotation;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Composed annotation for JPA slice tests.
 *
 * Bundles the boilerplate that every @DataJpaTest class needs so that
 * contributors apply one annotation instead of remembering the combination.
 *
 * Equivalent to:
 *   @DataJpaTest
 *   @AutoConfigureTestDatabase(replace = Replace.NONE)
 *   @ActiveProfiles("test")
 *
 * Replace.NONE tells Spring to use the datasource from application-test.yml
 * rather than auto-generating one, so the custom H2 URL (including NON_KEYWORDS)
 * is honored.
 *
 * Usage:
 *   @SliceTest
 *   class UserRoleRepositoryTest { … }
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public @interface SliceTest {
}
