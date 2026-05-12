package com.becon.opencelium.backend.unit.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.repository.MetaDataLogRepository;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.mapper.LogDataMapper;
import com.becon.opencelium.backend.execution.logger.parser.FlexiblePatternLogParser;
import com.becon.opencelium.backend.execution.logger.parser.ParsedLogLineBuilder;
import com.becon.opencelium.backend.execution.logger.service.LogDataServiceImp;
import com.becon.opencelium.backend.testutil.fixture.LogDataMngFixture;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.List;

import static com.becon.opencelium.backend.execution.logger.enums.PhaseCategory.EXECUTION;
import static com.becon.opencelium.backend.execution.logger.enums.PhaseCategory.FLOWCHART;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link LogDataServiceImp}.
 *
 * No Spring context is loaded. The dependencies are mocked with Mockito.
 * Run with: ./gradlew test
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserRoleServiceImpl — unit")
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
}
