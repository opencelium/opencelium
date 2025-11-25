package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.model.Operation;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Base64;

import static com.becon.opencelium.backend.utility.MediaTypeUtility.isBinaryCompatible;
import static com.becon.opencelium.backend.utility.MediaTypeUtility.isJsonCompatible;

public class OperationExecutor {
    private final ExecutionManager executionManager;
    private final RestTemplate restTemplate;
    private final OcLogger<ExecutionLog> logger;
    private final MaskingService masking;
    private final Pagination pagination;
    private String operationId;

    public OperationExecutor(
            ExecutionManager executionManager, RestTemplate restTemplate, Pagination pagination,
            OcLogger<ExecutionLog> logger, MaskingService masking
    ) {
        this.executionManager = executionManager;
        this.restTemplate = restTemplate;
        this.logger = logger;
        this.masking = masking;
        this.pagination = pagination;
    }


    public void execute(OperationDTO dto) {
        this.operationId = dto.getOperationId();

        Pagination pagination = resolvePagination(dto);
        executionManager.setPagination(pagination);

        boolean hasMore = false;
        long duration = 0;
        RequestEntity<?> requestEntity;
        ResponseEntity<?> responseEntity;
        Class<?> responseType = getResponseType(dto);
        do {
            requestEntity = RequestEntityBuilder.start()
                    .forOperation(dto)
                    .usingReferences(executionManager::getValue)
                    .createRequest();

            URI uri = resolveURI(requestEntity.getUrl(), pagination);

            logger.logAndSend(String.format("segment=REQUEST url=%s http_method=%s", masking.applyMask(uri, buildRef("request", "url")), requestEntity.getMethod()));
            logger.logAndSend(String.format("segment=REQUEST_HEADER data=%s", masking.applyMask(requestEntity.getHeaders(), buildRef("request", "header"))));
            logger.logAndSend(String.format("segment=REQUEST_PAYLOAD data=%s", masking.applyMask(requestEntity.getBody(), buildRef("request", "body"))));

            long startTime = System.currentTimeMillis();
            responseEntity = sendRequest(uri, requestEntity, responseType);
            duration += (System.currentTimeMillis() - startTime);

            if (pagination != null) {
                pagination.updateParamValues(responseEntity, responseType);
                hasMore = pagination.hasMore();
            }
        } while (hasMore);

        if (responseType.equals(byte[].class)) {
            byte[] fileBytes = (byte[]) responseEntity.getBody();
            String base64Encoded = Base64.getEncoder().encodeToString(fileBytes);

            responseEntity = new ResponseEntity<>(base64Encoded, responseEntity.getHeaders(), responseEntity.getStatusCode());
        }

        if (pagination != null) {
            String paginatedBody = pagination.findParam(PageParam.RESULT).getValue();
            responseEntity = new ResponseEntity<>(paginatedBody, responseEntity.getHeaders(), responseEntity.getStatusCode());

            // remove reference for used pagination
            pagination = null;
            executionManager.setPagination(pagination);
        }
        logger.logAndSend(String.format("segment=RESPONSE status=%d duration=%dms", responseEntity.getStatusCode().value(), duration));
        logger.logAndSend(String.format("segment=RESPONSE_HEADER data=%s", masking.applyMask(responseEntity.getHeaders(), buildRef("response", "header"))));
        logger.logAndSend(String.format("segment=RESPONSE_PAYLOAD data=%s", masking.applyMask(responseEntity.getBody(), buildRef("response", "body"))));

        Operation operation = executionManager.findOperationByColor(operationId).orElseGet(() -> {
            Operation newOperation = Operation.fromDTO(dto, executionManager.getLoops().size());
            executionManager.addOperation(newOperation);

            return newOperation;
        });

        String key = executionManager.generateKey(operation.getLoopDepth());

        operation.addRequest(key, requestEntity);
        operation.addResponse(key, responseEntity);
    }


    private ResponseEntity<?> sendRequest(URI uri, RequestEntity<?> requestEntity, Class<?> responseType) {
        HttpEntity<Object> httpEntity = new HttpEntity<>(requestEntity.getBody(), requestEntity.getHeaders());

        return this.restTemplate.exchange(uri, requestEntity.getMethod(), httpEntity, responseType);
    }

    private ResponseEntity<?> convertException(Exception e) {
        if (e instanceof HttpStatusCodeException sce) {
            return ResponseEntity.status(sce.getStatusCode())
                    .headers(sce.getResponseHeaders())
                    .body(sce.getResponseBodyAsString());
        } else if (e instanceof ResourceAccessException rae) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Connection/Resource access error: " + rae.getMessage());
        } else if (e instanceof RestClientException rce) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("General client error: " + rce.getMessage());
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error: " + e.getMessage());
        }
    }

    private Pagination resolvePagination(OperationDTO dto) {
        if (dto.getOperationType() == OpType.PAGINATION) {
            Pagination pagination = dto.getPagination() != null ? dto.getPagination() : this.pagination;
            if (pagination != null) {
                return pagination.clone();
            }
        }

        return null;
    }

    private URI resolveURI(URI uri, Pagination pagination) {
        if (pagination == null || !pagination.existsParam(PageParam.LINK)) {
            return uri;
        }

        String nextLink = pagination.findParam(PageParam.LINK).getValue();
        if (nextLink == null || nextLink.isBlank()) {
            return uri;
        }

        try {
            return new URI(nextLink);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid pagination link URI: " + nextLink, e);
        }
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

    private String buildRef(String type, String part) {
        return this.operationId + ".(" + type + ")." + part;
    }
}
