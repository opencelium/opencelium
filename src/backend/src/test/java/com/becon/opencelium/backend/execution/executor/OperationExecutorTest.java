package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.enums.execution.HttpErrorHandlingStrategy;
import com.becon.opencelium.backend.execution.executor.model.Operation;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.resource.execution.OnErrorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.bson.assertions.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OperationExecutorTest {

    @Mock
    private ExecutionManager executionManager;
    @Mock
    private RestTemplate restTemplate;
    @Mock
    private OnErrorEx onError;
    @Mock
    private Pagination pagination;
    @Mock(lenient = true)
    private OcLogger<ExecutionLog> logger;
    @Mock(lenient = true)
    private MaskingService masking;

    private OperationExecutor executor;

    @BeforeEach
    void setup() {
        executor = new OperationExecutor(executionManager, restTemplate, pagination, logger, masking, onError);

        doNothing().when(logger).logAndSend(anyString());
        when(masking.applyMask(any(), anyString())).thenReturn("");
    }


    @Test
    void testOnErrorContinueStrategy_ReturnsConvertedResponse() {
        // GIVEN
        when(onError.getStrategy()).thenReturn(HttpErrorHandlingStrategy.CONTINUE);

        // simulate HTTP 400 response
        when(restTemplate.exchange(any(), any(), any(), any(Class.class)))
                .thenThrow(new HttpStatusCodeException(HttpStatus.BAD_REQUEST, "Bad Request") {});

        // use a real operation object to capture stored responses
        Operation operation = new Operation();
        when(executionManager.findOperationByColor("#ABABF5"))
                .thenReturn(Optional.of(operation));
        when(executionManager.generateKey(anyInt())).thenReturn("TEST_KEY");

        // create minimal OperationDTO
        OperationDTO dto = new OperationDTO();
        dto.setOperationId("#ABABF5");
        dto.setHttpMethod(HttpMethod.GET);
        dto.setPath("/test");
        ResponseDTO responseDTO = new ResponseDTO();
        responseDTO.setStatus("success");
        dto.setResponses(List.of(responseDTO));

        // WHEN
        executor.execute(dto);

        // THEN
        ResponseEntity<?> savedResponse = operation.getResponses().get("TEST_KEY");
        assertNotNull(savedResponse);
        assertEquals(HttpStatus.BAD_REQUEST, savedResponse.getStatusCode());
    }

    @Test
    void testOnErrorStopStrategy_StopsExecution() {
        // GIVEN
        when(onError.getStrategy()).thenReturn(HttpErrorHandlingStrategy.STOP);

        // simulate HTTP 400 response
        when(restTemplate.exchange(any(), any(), any(), any(Class.class)))
                .thenThrow(new HttpStatusCodeException(HttpStatus.BAD_REQUEST, "Bad Request") {});

        // create minimal OperationDTO
        OperationDTO dto = new OperationDTO();
        dto.setOperationId("#ABABF5");
        dto.setHttpMethod(HttpMethod.GET);
        dto.setPath("/test");
        ResponseDTO responseDTO = new ResponseDTO();
        responseDTO.setStatus("success");
        dto.setResponses(List.of(responseDTO));

        // WHEN and THEN
        assertThrows(HttpStatusCodeException.class, () -> executor.execute(dto));
    }
}