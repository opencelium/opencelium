package io.opencelium.core.testsupport;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * A full {@code @SpringBootTest} against the local MongoDB whose per-class database is dropped after the last test.
 * The class still declares its own {@code @DynamicPropertySource} that calls
 * {@link LocalMongo#register(org.springframework.test.context.DynamicPropertyRegistry, Class, java.util.function.Supplier)},
 * because Spring caches contexts by that method: an inherited one would share one context, and one database, across
 * classes.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@SpringBootTest
@ExtendWith(LocalMongo.Cleanup.class)
public @interface MongoIntegrationTest {

}
