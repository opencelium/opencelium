package com.becon.opencelium.backend.unit.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.database.mongodb.entity.LogGlobalSnapshotEntry;
import com.becon.opencelium.backend.database.mongodb.repository.MetaDataLogRepository;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilderFactory;
import com.becon.opencelium.backend.execution.logger.builder.strategies.DefaultPhaseBuilderFactory;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.mapper.LogDataMapper;
import com.becon.opencelium.backend.execution.logger.mapper.ParsedLogLineMapper;
import com.becon.opencelium.backend.execution.logger.parser.FlexiblePatternLogParser;
import com.becon.opencelium.backend.execution.logger.parser.ParsedLogLineBuilder;
import com.becon.opencelium.backend.execution.logger.service.LogDataServiceImp;
import com.becon.opencelium.backend.testutil.fixture.LogDataMngFixture;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static com.becon.opencelium.backend.execution.logger.enums.PhaseCategory.EXECUTION;
import static com.becon.opencelium.backend.execution.logger.enums.PhaseCategory.FLOWCHART;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link LogDataServiceImp}.
 *
 * No Spring context is loaded. The dependencies are mocked with Mockito.
 * Run with: ./gradlew test
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LogDataServiceImp — unit")
public class LogDataServiceImpTest {
    @Mock
    private MetaDataLogRepository repository;
    @Mock
    private FlexiblePatternLogParser parser;
    @Mock
    private LogDataMapper mapper;
    @Mock
    private ParsedLogLineBuilder parsedLogLineBuilder;

    @InjectMocks
    private LogDataServiceImp service;

    private static final List<LogGlobalSnapshotEntry> SNAPSHOT = List.of(
            new LogGlobalSnapshotEntry("idoitApiKey", 2L, "\"••••\"", null),
            new LogGlobalSnapshotEntry("idoitUrl", 4L, "\"https://cmdb.example\"", null));

    private final ApplicationContext contextBefore = ApplicationContextUtility.getApplicationContext();

    @Test
    void getDetailsByIdReturnsDTOWhenEntityIsInBuffer() {
        // GIVEN
        var emptyLogData = LogDataMngFixture.anEmptyLogData();
        var flowchart = LogDataMngFixture.aFlowchartPhaseLogData();

        String phaseId = flowchart.getId();

        when(repository.findById(phaseId))
                .thenReturn(emptyLogData);

        when(repository.findByExecutionIdAndType(any(), any()))
                .thenReturn(emptyLogData);

        when(repository.findByFlowIdAndType(any(), any()))
                .thenReturn(emptyLogData);

        when(mapper.toDto(flowchart))
                .thenReturn(new LogDataDTO());

        // put flowchart in buffer
        service.bufferAndFlush(flowchart);

        // WHEN-THEN
        assertDoesNotThrow(() ->
                service.getDetailsById(phaseId)
        );
    }

    @Test
    void getChildrenByIdReturnsChildrenWhenEntityIsInBuffer() {
        // GIVEN
        var emptyLogData = LogDataMngFixture.anEmptyLogData();

        var parent = LogDataMngFixture.aFlowchartPhaseLogData();

        when(repository.findById(parent.getId()))
                .thenReturn(emptyLogData);

        when(repository.findByExecutionIdAndType(parent.getId(), EXECUTION.name()))
                .thenReturn(emptyLogData);

        when(repository.findByFlowIdAndType(parent.getId(), FLOWCHART.name()))
                .thenReturn(emptyLogData);

        var child = LogDataMngFixture.anOperationPhaseLogData();

        when(repository.findChildren(eq(parent.getExecutionId()), eq(parent.getFlowId()), anyString(), any(Sort.class)))
                .thenReturn(List.of(child));

        when(mapper.toDto(child))
                .thenReturn(new LogDataDTO());

        // put parent and child in buffer
        service.bufferAndFlush(parent);
        service.bufferAndFlush(child);

        // WHEN
        List<LogDataDTO> result = service.getChildrenById(parent.getId(), "0");

        // THEN
        assertNotNull(result);
        Assertions.assertEquals(1, result.size());
    }

    @Test
    void bufferAndFlushSavesEachBlockExactlyOnceWhenExecutionCompletes() {
        // GIVEN
        var flowchart = LogDataMngFixture.aFlowchartPhaseLogData();
        var operation = LogDataMngFixture.anOperationPhaseLogData();
        var executionEnd = LogDataMngFixture.anExecutionCompletePhaseLogData();

        // WHEN
        service.bufferAndFlush(flowchart);
        service.bufferAndFlush(operation);
        service.bufferAndFlush(executionEnd);

        // THEN: the completed execution flushes the buffer in a single batch
        // that contains every block once, without duplicates
        ArgumentCaptor<List<LogDataMng>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());

        List<LogDataMng> saved = captor.getValue();
        Assertions.assertEquals(3, saved.size());
        Assertions.assertEquals(3, saved.stream().distinct().count());
    }

    @Test
    @DisplayName("bufferAndFlush — the snapshot built when the execution ends reaches the stored execution block")
    void bufferAndFlushStoresSnapshotWhenExecutionCompletes() {
        LogDataMng start = anExecutionBlock(PhaseStatus.PENDING);
        LogDataMng end = LogDataMngFixture.anExecutionCompletePhaseLogData();
        end.setGlobalSnapshot(SNAPSHOT);

        service.bufferAndFlush(start);
        service.bufferAndFlush(end);

        ArgumentCaptor<List<LogDataMng>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).isNotEmpty().allSatisfy(saved -> {
            assertThat(saved.getId()).isEqualTo(start.getId());
            assertThat(saved.getGlobalSnapshot()).isEqualTo(SNAPSHOT);
        });
    }

    @Test
    @DisplayName("bufferAndFlush — a block without a snapshot does not wipe the one already stored")
    void bufferAndFlushKeepsStoredSnapshotWhenIncomingHasNone() {
        LogDataMng failed = anExecutionBlock(PhaseStatus.FAIL);
        failed.setGlobalSnapshot(SNAPSHOT);
        LogDataMng end = LogDataMngFixture.anExecutionCompletePhaseLogData();

        service.bufferAndFlush(failed);
        service.bufferAndFlush(end);

        ArgumentCaptor<List<LogDataMng>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).isNotEmpty()
                .allSatisfy(saved -> assertThat(saved.getGlobalSnapshot()).isEqualTo(SNAPSHOT));
    }

    @Test
    @DisplayName("getDetailsById — the details of an EXECUTION element carry its stored snapshot")
    void getDetailsByIdReturnsSnapshotWhenElementIsExecution() {
        LogDataMng execution = LogDataMngFixture.anExecutionCompletePhaseLogData();
        execution.setGlobalSnapshot(SNAPSHOT);
        when(repository.findById(execution.getId())).thenReturn(Optional.of(execution));
        useApplicationContextOfExecutionTracker();

        service.getDetailsById(execution.getId());

        ArgumentCaptor<LogDataMng> captor = ArgumentCaptor.forClass(LogDataMng.class);
        verify(mapper).toDto(captor.capture());
        assertThat(captor.getValue().getGlobalSnapshot()).isEqualTo(SNAPSHOT);
    }

    @AfterEach
    void restoreApplicationContext() {
        new ApplicationContextUtility().setApplicationContext(contextBefore);
    }

    /** An EXECUTION block with the key of the fixture's completed one, but its own id. */
    private static LogDataMng anExecutionBlock(PhaseStatus status) {
        LogDataMng block = LogDataMngFixture.anExecutionCompletePhaseLogData();
        block.setId("69fac335ee4ea82b347c51f0");
        block.setStatus(status);
        return block;
    }

    /**
     * Reading the details of an EXECUTION element builds an execution tracker, which takes its
     * collaborators from the static application context; {@link #restoreApplicationContext()}
     * puts the previous one back, so no other test sees this one.
     */
    private static void useApplicationContextOfExecutionTracker() {
        ApplicationContext context = mock(ApplicationContext.class);
        when(context.getBean(PhaseBuilderFactory.class)).thenReturn(new DefaultPhaseBuilderFactory());
        when(context.getBean(ParsedLogLineMapper.class)).thenReturn(new ParsedLogLineMapper());
        new ApplicationContextUtility().setApplicationContext(context);
    }
}
