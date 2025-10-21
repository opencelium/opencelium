package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.executor.model.Operation;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.resource.execution.FlowchartEx;
import com.becon.opencelium.backend.resource.execution.OnErrorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.Base64;
import java.util.function.BiFunction;

import static com.becon.opencelium.backend.utility.MediaTypeUtility.isBinaryCompatible;
import static com.becon.opencelium.backend.utility.MediaTypeUtility.isJsonCompatible;

public class OperationExecutor {
    private final ExecutionManager executionManager;
    private final RestTemplate restTemplate;
    private final OcLogger<ExecutionLog> logger;
    private final MaskingService masking;
    private final Pagination pagination;

    public OperationExecutor(
            FlowchartEx flowchart, ExecutionManager executionManager,
            OcLogger<ExecutionLog> logger, MaskingService masking, OnErrorEx onErros, ProxyEx proxy
    ) {
        this.executionManager = executionManager;
        this.restTemplate = buildRestTemplate(flowchart, proxy);
        this.logger = logger;
        this.masking = masking;
        this.pagination = flowchart.getPagination();
    }


    public void execute(OperationDTO dto) {
        BiFunction<String, String, String> toRef = (type, part) -> dto.getOperationId() + ".(" + type + ")." + part;

        Pagination pagination = null;
        if (dto.getOperationType() == OpType.PAGINATION) {
            pagination = dto.getPagination() != null ? dto.getPagination() : this.pagination;

            if (pagination != null) {
                pagination = pagination.clone();
            }
        }
        executionManager.setPagination(pagination);

        boolean hasMore = false;
        long duration = 0;
        RequestEntity<?> requestEntity;
        Class<?> responseType;
        ResponseEntity<?> responseEntity;
        do {
            requestEntity = RequestEntityBuilder.start()
                    .forOperation(dto)
                    .usingReferences(executionManager::getValue)
                    .createRequest();

            URI uri = requestEntity.getUrl();
            if (pagination != null && pagination.existsParam(PageParam.LINK)) {
                String nextElemLink = pagination.findParam(PageParam.LINK).getValue();
                if (nextElemLink != null && !nextElemLink.isEmpty()) {
                    try {
                        uri = new URI(nextElemLink);
                    } catch (URISyntaxException e) {
                        throw new RuntimeException(e);
                    }
                }
            }

            logger.logAndSend(String.format("segment=REQUEST url=%s http_method=%s", masking.applyMask(uri, toRef.apply("request", "url")), requestEntity.getMethod()));
            logger.logAndSend(String.format("segment=REQUEST_HEADER data=%s", masking.applyMask(requestEntity.getHeaders(), toRef.apply("request", "header"))));
            logger.logAndSend(String.format("segment=REQUEST_PAYLOAD data=%s", masking.applyMask(requestEntity.getBody(), toRef.apply("request", "body"))));

            HttpEntity<Object> httpEntity = new HttpEntity<>(requestEntity.getBody(), requestEntity.getHeaders());
            responseType = getResponseType(dto);

            long startTime = System.currentTimeMillis();
            responseEntity = this.restTemplate.exchange(uri, requestEntity.getMethod(), httpEntity, responseType);
            duration += (System.currentTimeMillis() - startTime);

            if (pagination != null) {
                pagination.updateParamValues(responseEntity, responseType);
                hasMore = pagination.hasMore();
            }
        } while (hasMore);

        if (responseType.equals(byte[].class)) {
            byte[] fileBytes = (byte[]) responseEntity.getBody();
            String base64Encoded = Base64.getEncoder().encodeToString(fileBytes);

            responseEntity = new ResponseEntity<>(base64Encoded,
                    responseEntity.getHeaders(),
                    responseEntity.getStatusCode());
        }

        if (pagination != null) {
            String paginatedBody = pagination.findParam(PageParam.RESULT).getValue();
            responseEntity = new ResponseEntity<>(paginatedBody,
                    responseEntity.getHeaders(),
                    responseEntity.getStatusCode());

            // remove reference for used pagination
            pagination = null;
            executionManager.setPagination(pagination);
        }
        logger.logAndSend(String.format("segment=RESPONSE status=%d duration=%dms", responseEntity.getStatusCode().value(), duration));
        logger.logAndSend(String.format("segment=RESPONSE_HEADER data=%s", masking.applyMask(responseEntity.getHeaders(), toRef.apply("response", "header"))));
        logger.logAndSend(String.format("segment=RESPONSE_PAYLOAD data=%s", masking.applyMask(responseEntity.getBody(), toRef.apply("response", "body"))));

        Operation operation = executionManager.findOperationByColor(dto.getOperationId())
                .orElseGet(() -> {
                    int loopDepth = executionManager.getLoops().size(); // in which depth the operation is executed

                    Operation newOperation = Operation.fromDTO(dto, loopDepth);
                    executionManager.addOperation(newOperation);

                    return newOperation;
                });

        String key = executionManager.generateKey(operation.getLoopDepth());

        operation.addRequest(key, requestEntity);
        operation.addResponse(key, responseEntity);
    }

    private Class<?> getResponseType(OperationDTO dto) {
        MediaType mediaType = MediaType.APPLICATION_JSON;
        for (ResponseDTO response : dto.getResponses()) {
            if ("success".equals(response.getStatus())) {
                mediaType = response.getContent();
            }
        }

        if (isJsonCompatible(mediaType)) {
            return Object.class;
        } else if (isBinaryCompatible(mediaType)) {
            return byte[].class;
        } else {
            return String.class;
        }
    }

    private RestTemplate buildRestTemplate(FlowchartEx flowchart, ProxyEx proxy) {
        int timeout = flowchart.getTimeout();
        RestTemplateBuilder restTemplateBuilder =
                new RestTemplateBuilder(new RestCustomizer(proxy.getHost(), proxy.getPort(), proxy.getUser(), proxy.getPassword(), flowchart.isSslCert(), timeout));
        if (timeout > 0) {
            restTemplateBuilder.setReadTimeout(Duration.ofMillis(timeout));
        }

        return restTemplateBuilder.build();
    }
}
