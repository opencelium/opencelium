package com.becon.opencelium.backend.slice.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.LastExecution;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.LastExecutionRepository;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JPA slice tests for {@link LastExecutionRepository}.
 * <p>
 * The has-log updates are bulk JPQL updates guarded by scheduler and execution id. They run
 * against H2 to verify that guard and that each update changes only its own flag.
 * <p>
 * Run with: ./gradlew test --tests "*.LastExecutionRepositoryTest"
 */
@SliceTest
@DisplayName("LastExecutionRepository — JPA slice")
class LastExecutionRepositoryTest {
    private static final long LAST_SUCCESS_ID = 540L;
    private static final long PREVIOUS_SUCCESS_ID = 539L;
    private static final long LAST_FAILURE_ID = 535L;
    private static final long PREVIOUS_FAILURE_ID = 534L;

    @Autowired
    private TestEntityManager em;

    @Autowired
    private LastExecutionRepository repository;

    // ── markFailLogAvailable ─────────────────────────────────────────────────

    @Test
    void markFailLogAvailableSetsFlagWhenExecutionIsLastFailure() {
        LastExecution lastExecution = persistLastExecution();

        repository.markFailLogAvailable(schedulerIdOf(lastExecution), LAST_FAILURE_ID);

        assertThat(reload(lastExecution).isFailHasLog()).isTrue();
    }

    @Test
    void markFailLogAvailableKeepsFlagUnsetWhenNewerFailureReplacedIt() {
        LastExecution lastExecution = persistLastExecution();

        repository.markFailLogAvailable(schedulerIdOf(lastExecution), PREVIOUS_FAILURE_ID);

        assertThat(reload(lastExecution).isFailHasLog()).isFalse();
    }

    @Test
    void markFailLogAvailableKeepsFlagUnsetWhenSchedulerDoesNotMatch() {
        LastExecution lastExecution = persistLastExecution();
        int otherSchedulerId = persistScheduler("hourly sync").getId();

        repository.markFailLogAvailable(otherSchedulerId, LAST_FAILURE_ID);

        assertThat(reload(lastExecution).isFailHasLog()).isFalse();
    }

    @Test
    void markFailLogAvailableLeavesSuccessFlagUnchanged() {
        LastExecution lastExecution = persistLastExecution();

        repository.markFailLogAvailable(schedulerIdOf(lastExecution), LAST_FAILURE_ID);

        assertThat(reload(lastExecution).isSuccessHasLog()).isFalse();
    }

    // ── markSuccessLogAvailable ──────────────────────────────────────────────

    @Test
    void markSuccessLogAvailableSetsFlagWhenExecutionIsLastSuccess() {
        LastExecution lastExecution = persistLastExecution();

        repository.markSuccessLogAvailable(schedulerIdOf(lastExecution), LAST_SUCCESS_ID);

        assertThat(reload(lastExecution).isSuccessHasLog()).isTrue();
    }

    @Test
    void markSuccessLogAvailableKeepsFlagUnsetWhenNewerSuccessReplacedIt() {
        LastExecution lastExecution = persistLastExecution();

        repository.markSuccessLogAvailable(schedulerIdOf(lastExecution), PREVIOUS_SUCCESS_ID);

        assertThat(reload(lastExecution).isSuccessHasLog()).isFalse();
    }

    @Test
    void markSuccessLogAvailableKeepsFlagUnsetWhenSchedulerDoesNotMatch() {
        LastExecution lastExecution = persistLastExecution();
        int otherSchedulerId = persistScheduler("hourly sync").getId();

        repository.markSuccessLogAvailable(otherSchedulerId, LAST_SUCCESS_ID);

        assertThat(reload(lastExecution).isSuccessHasLog()).isFalse();
    }

    @Test
    void markSuccessLogAvailableLeavesFailFlagUnchanged() {
        LastExecution lastExecution = persistLastExecution();

        repository.markSuccessLogAvailable(schedulerIdOf(lastExecution), LAST_SUCCESS_ID);

        assertThat(reload(lastExecution).isFailHasLog()).isFalse();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private LastExecution persistLastExecution() {
        LastExecution lastExecution = new LastExecution();
        lastExecution.setScheduler(persistScheduler("nightly sync"));
        lastExecution.setSuccessExecutionId(LAST_SUCCESS_ID);
        lastExecution.setSuccessHasLog(false);
        lastExecution.setFailExecutionId(LAST_FAILURE_ID);
        lastExecution.setFailHasLog(false);
        return em.persistAndFlush(lastExecution);
    }

    private Scheduler persistScheduler(String title) {
        Scheduler scheduler = new Scheduler();
        scheduler.setTitle(title);
        return em.persistAndFlush(scheduler);
    }

    private LastExecution reload(LastExecution lastExecution) {
        em.flush();
        em.clear();
        return em.find(LastExecution.class, lastExecution.getId());
    }

    private static int schedulerIdOf(LastExecution lastExecution) {
        return lastExecution.getScheduler().getId();
    }
}
