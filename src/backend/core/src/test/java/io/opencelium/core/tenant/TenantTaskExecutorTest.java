package io.opencelium.core.tenant;

import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Parallel work that a request or a background task starts on the application task executor runs for the tenant of
 * its caller.
 */
@MongoIntegrationTest
class TenantTaskExecutorTest {

	private static final Duration WAIT = Duration.ofSeconds(10);

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, TenantTaskExecutorTest.class, () -> dataDir);
	}

	@Autowired
	@Qualifier(TaskExecutionAutoConfiguration.APPLICATION_TASK_EXECUTOR_BEAN_NAME)
	TaskExecutor executor;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	CurrentTenant currentTenant;

	@Test
	void executeRunsTheTaskForTheTenantOfTheCallerWhenTheApplicationTaskExecutorRunsIt() {
		var thread = new CompletableFuture<Thread>();
		var tenant = new CompletableFuture<TenantId>();

		tenantRunner.run(TenantId.SELF_HOST, () -> executor.execute(() -> {
			thread.complete(Thread.currentThread());
			try {
				tenant.complete(currentTenant.get());
			}
			catch (RuntimeException ex) {
				tenant.completeExceptionally(ex);
			}
		}));

		assertThat(thread).succeedsWithin(WAIT).isNotSameAs(Thread.currentThread());
		assertThat(tenant).succeedsWithin(WAIT).isEqualTo(TenantId.SELF_HOST);
	}

}
