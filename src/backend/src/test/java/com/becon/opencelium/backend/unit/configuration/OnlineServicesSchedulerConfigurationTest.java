package com.becon.opencelium.backend.unit.configuration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import com.becon.opencelium.backend.api.TemplateSyncService;
import com.becon.opencelium.backend.configuration.OnlineServicesSchedulerConfiguration;
import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.config.CronTask;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

/**
 * Unit tests for {@link OnlineServicesSchedulerConfiguration}.
 *
 * Asserts on the state of a real {@link ScheduledTaskRegistrar} (which cron
 * tasks got registered) rather than on interactions. The registered runnable
 * is executed to prove the right sync service is wired to the right cron.
 *
 * Run with: ./gradlew test --tests "*.OnlineServicesSchedulerConfigurationTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OnlineServicesSchedulerConfiguration — cron registration")
class OnlineServicesSchedulerConfigurationTest {

    private static final String CRON = "0 0 0 * * *";

    @Mock
    private InvokerSyncService invokerSyncService;

    @Mock
    private TemplateSyncService templateSyncService;

    private OnlineServicesProps props;
    private ScheduledTaskRegistrar registrar;

    @BeforeEach
    void setUp() {
        props = new OnlineServicesProps();
        registrar = new ScheduledTaskRegistrar();
    }

    @Test
    void configureTasksRegistersNoTasksWhenServiceInactive() {
        props.setActive(false);
        props.setInvokerSync(invokerSync(true, CRON));
        props.setTemplateSync(templateSync(true, CRON));
        OnlineServicesSchedulerConfiguration configuration = newConfiguration();

        configuration.configureTasks(registrar);

        assertThat(registrar.getCronTaskList()).isEmpty();
    }

    @Test
    void configureTasksRegistersNoTasksWhenSyncBlocksAreMissing() {
        // The whole online-services block is commented out: active defaults to
        // true, but without sync sub-blocks nothing may be scheduled.
        OnlineServicesSchedulerConfiguration configuration = newConfiguration();

        configuration.configureTasks(registrar);

        assertThat(registrar.getCronTaskList()).isEmpty();
    }

    @Test
    void configureTasksRegistersInvokerSyncTaskWhenInvokerSyncActive() {
        props.setInvokerSync(invokerSync(true, CRON));
        OnlineServicesSchedulerConfiguration configuration = newConfiguration();

        configuration.configureTasks(registrar);

        assertThat(registrar.getCronTaskList()).hasSize(1);
        CronTask task = registrar.getCronTaskList().get(0);
        assertThat(task.getExpression()).isEqualTo(CRON);
        task.getRunnable().run();
        verify(invokerSyncService).syncInvokers();
    }

    @Test
    void configureTasksRegistersTemplateSyncTaskWhenTemplateSyncActive() {
        props.setTemplateSync(templateSync(true, CRON));
        OnlineServicesSchedulerConfiguration configuration = newConfiguration();

        configuration.configureTasks(registrar);

        assertThat(registrar.getCronTaskList()).hasSize(1);
        CronTask task = registrar.getCronTaskList().get(0);
        assertThat(task.getExpression()).isEqualTo(CRON);
        task.getRunnable().run();
        verify(templateSyncService).syncTemplates();
    }

    @Test
    void configureTasksSkipsTaskWhenCronIsDashPlaceholder() {
        props.setInvokerSync(invokerSync(true, "-"));
        OnlineServicesSchedulerConfiguration configuration = newConfiguration();

        configuration.configureTasks(registrar);

        assertThat(registrar.getCronTaskList()).isEmpty();
    }

    private OnlineServicesSchedulerConfiguration newConfiguration() {
        return new OnlineServicesSchedulerConfiguration(props, invokerSyncService, templateSyncService);
    }

    private static OnlineServicesProps.InvokerSync invokerSync(boolean active, String time) {
        OnlineServicesProps.InvokerSync sync = new OnlineServicesProps.InvokerSync();
        sync.setActive(active);
        sync.setTime(time);
        return sync;
    }

    private static OnlineServicesProps.TemplateSync templateSync(boolean active, String time) {
        OnlineServicesProps.TemplateSync sync = new OnlineServicesProps.TemplateSync();
        sync.setActive(active);
        sync.setTime(time);
        return sync;
    }
}
