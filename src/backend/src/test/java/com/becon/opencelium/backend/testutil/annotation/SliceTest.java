/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.annotation;

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
 *   @ActiveProfiles("test")
 *
 * Usage:
 *   @SliceTest
 *   class UserRoleRepositoryTest { … }
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@DataJpaTest
@ActiveProfiles("test")
public @interface SliceTest {
}
