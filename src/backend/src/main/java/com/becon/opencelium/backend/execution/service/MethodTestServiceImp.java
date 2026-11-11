package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.CurlCommandBuilder;
import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.execution.ExecutionManagerImpl;
import com.becon.opencelium.backend.execution.OperationExchange;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.execution.oc721.StaticValueExtractor;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.execution.ConnectorExMapper;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.reference.OperationReferenceCollector;
import com.becon.opencelium.backend.reference.ReferenceMatchers;
import com.becon.opencelium.backend.reference.ReferenceParser;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.reference.model.RequestDataReference;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodCurlRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodCurlResultDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.ConnectorReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.StaticReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.ConnectorError;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.ReceivedResponse;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.SentRequest;
import com.becon.opencelium.backend.resource.execution.MethodConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Tests a single method by sending its request to the real API.
 *
 * <p>The method is built the way a connection execution builds it, so the request is the one the
 * execution would send. Its references are resolved by a {@link StaticValueExtractor}: request
 * data references are read from the connectors, every other reference takes the static value the
 * user gave for it. The same request can be returned as a cURL command instead of being sent.
 *
 * <p>Not transactional on purpose: the connectors are read detached and their decrypted request
 * data must never be flushed back to the database.
 */
@Service
public class MethodTestServiceImp implements MethodTestService {

    private static final Set<HttpMethod> READ_ONLY_METHODS =
            Set.of(HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS);
    private static final String PUBLIC_VISIBILITY = "public";
    private static final String MASK = "****";

    private final Environment environment;
    private final MethodMngMapper methodMngMapper;
    private final OperationExMapper operationExMapper;
    private final ConnectorExMapper connectorExMapper;
    private final ConnectorService connectorService;
    private final InvokerService invokerService;

    public MethodTestServiceImp(
            Environment environment,
            MethodMngMapper methodMngMapper,
            OperationExMapper operationExMapper,
            ConnectorExMapper connectorExMapper,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("invokerServiceImp") InvokerService invokerService) {
        this.environment = environment;
        this.methodMngMapper = methodMngMapper;
        this.operationExMapper = operationExMapper;
        this.connectorExMapper = connectorExMapper;
        this.connectorService = connectorService;
        this.invokerService = invokerService;
    }

    @Override
    public MethodTestReferencesDTO findReferences(MethodDTO method) {
        OperationDTO operation = toOperation(method);

        Map<Integer, Set<String>> fieldsByConnector = new HashMap<>();
        List<ConnectorReference> connectorReferences = new ArrayList<>();
        List<StaticReference> staticReferences = new ArrayList<>();

        for (String reference : OperationReferenceCollector.collect(operation)) {
            Optional<ConnectorField> field = connectorFieldOf(reference, operation.getConnectorId());

            if (field.isPresent()) {
                int connectorId = field.get().connectorId();
                String key = field.get().key();
                boolean available = fieldsByConnector
                        .computeIfAbsent(connectorId, this::fieldNamesOf)
                        .contains(key);

                connectorReferences.add(new ConnectorReference(reference, connectorId, key, available));
            } else {
                staticReferences.add(new StaticReference(reference, typeOf(reference)));
            }
        }

        return new MethodTestReferencesDTO(connectorReferences, staticReferences);
    }

    @Override
    public MethodTestResultDTO test(MethodTestRequestDTO request) {
        OperationDTO operation = toOperation(request.method());
        requireWriteConfirmed(operation, request.confirmWrite());

        PreparedRequest prepared = prepare(operation, request.staticValues());
        if (!prepared.connectorErrors().isEmpty()) {
            return MethodTestResultDTO.notSent(prepared.connectorErrors());
        }

        RequestEntity<?> requestEntity = prepared.request();
        Class<?> responseType = OperationExchange.responseTypeOf(operation);
        RestTemplate restTemplate = newRestTemplate(prepared.ownConnector());

        long start = System.nanoTime();
        ResponseEntity<?> response =
                OperationExchange.exchange(restTemplate, requestEntity.getUrl(), requestEntity, responseType);
        long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);

        return MethodTestResultDTO.sent(
                toSentRequest(requestEntity, prepared.secrets()), toReceivedResponse(response), durationMs);
    }

    @Override
    public MethodCurlResultDTO toCurl(MethodCurlRequestDTO request) {
        OperationDTO operation = toOperation(request.method());

        PreparedRequest prepared = prepare(operation, request.staticValues());
        if (!prepared.connectorErrors().isEmpty()) {
            return MethodCurlResultDTO.notBuilt(prepared.connectorErrors());
        }

        MethodConnectorEx ownConnector = prepared.ownConnector();
        String curl = CurlCommandBuilder.forRequest(prepared.request())
                .insecure(ownConnector != null && ownConnector.isSslCert())
                .connectTimeoutMillis(ownConnector != null ? ownConnector.getTimeout() : 0)
                .build();

        return MethodCurlResultDTO.built(curl);
    }

    /**
     * Reads the connectors the request of {@code operation} needs and builds the request, the way
     * a connection execution would build it. Sends no request of its own, but reading connector
     * data can, e.g. to obtain a token.
     *
     * @return the built request, or only the connector errors when a connector cannot be read
     */
    private PreparedRequest prepare(OperationDTO operation, Map<String, Object> staticValues) {
        Set<Integer> connectorIds = connectorsToRead(operation, staticValues);

        Map<Integer, MethodConnectorEx> connectors = new HashMap<>();
        Set<String> secrets = new HashSet<>();
        List<ConnectorError> errors = new ArrayList<>();

        for (Integer connectorId : connectorIds) {
            try {
                Connector connector = connectorService.getById(connectorId);
                Set<String> hiddenFields = hiddenFieldsOf(connector);
                MethodConnectorEx resolved = connectorExMapper.toMethodConnector(connector);

                connectors.put(connectorId, resolved);
                hiddenFields.stream()
                        .map(resolved.getRequiredData()::get)
                        .filter(StringUtils::isNotBlank)
                        .forEach(secrets::add);
            } catch (RuntimeException e) {
                errors.add(new ConnectorError(connectorId, e.getMessage()));
            }
        }

        if (!errors.isEmpty()) {
            return PreparedRequest.failed(errors);
        }

        return new PreparedRequest(
                buildRequest(operation, staticValues, connectors),
                connectors.get(operation.getConnectorId()),
                secrets,
                List.of());
    }

    private OperationDTO toOperation(MethodDTO method) {
        if (method == null || method.getRequest() == null || StringUtils.isBlank(method.getRequest().getMethod())) {
            throw new GeneralServiceException(
                    HttpStatus.BAD_REQUEST,
                    ExceptionConstant.METHOD_TEST_METHOD_INVALID,
                    "The method to test must have a request with an HTTP method.");
        }

        MethodMng methodMng = methodMngMapper.toEntity(method);

        // a pure HTTP request may arrive with an empty or default connector reference
        MethodConnectorMng connector = methodMng.getConnector();
        if (connector != null && !isRealConnector(connector.getConnectorId())) {
            methodMng.setConnector(null);
        }

        OperationDTO operation = operationExMapper.toOperationAll(List.of(methodMng), null).get(0);

        // a connection execution runs every method under the default connector
        operation.setInvoker(ConnectionConstants.DEFAULT_INVOKER_NAME);

        return operation;
    }

    private static boolean isRealConnector(Integer connectorId) {
        return connectorId != null && !ConnectionConstants.DEFAULT_CONNECTOR_ID.equals(connectorId);
    }

    private static void requireWriteConfirmed(OperationDTO operation, boolean confirmWrite) {
        if (confirmWrite || READ_ONLY_METHODS.contains(operation.getHttpMethod())) {
            return;
        }

        throw new GeneralServiceException(
                HttpStatus.BAD_REQUEST,
                ExceptionConstant.METHOD_TEST_WRITE_NOT_CONFIRMED,
                "The method sends a %s request to the real API. Set confirmWrite to true to send it."
                        .formatted(operation.getHttpMethod().name()));
    }

    /**
     * Returns the connectors whose data the request needs: the method's own connector, and every
     * connector referenced by a request data reference without a static value.
     *
     * @throws GeneralServiceException when a reference that is not connector data has no static
     *     value
     */
    private static Set<Integer> connectorsToRead(OperationDTO operation, Map<String, Object> staticValues) {
        Set<Integer> connectorIds = new LinkedHashSet<>();
        if (operation.getConnectorId() != null) {
            connectorIds.add(operation.getConnectorId());
        }

        List<String> missing = new ArrayList<>();
        for (String reference : OperationReferenceCollector.collect(operation)) {
            if (staticValues.containsKey(reference)) {
                continue;
            }

            connectorFieldOf(reference, operation.getConnectorId()).ifPresentOrElse(
                    field -> connectorIds.add(field.connectorId()),
                    () -> missing.add(reference));
        }

        if (!missing.isEmpty()) {
            throw new GeneralServiceException(
                    HttpStatus.BAD_REQUEST,
                    ExceptionConstant.METHOD_TEST_STATIC_VALUES_MISSING,
                    "Static values are missing for references: " + String.join(", ", missing));
        }

        return connectorIds;
    }

    /**
     * Returns the connector field {@code reference} reads, when it is a request data reference
     * bound to a connector: its own connector id, or else the method's connector.
     */
    private static Optional<ConnectorField> connectorFieldOf(String reference, Integer ownConnectorId) {
        if (!ReferenceMatchers.isRequestData(reference)) {
            return Optional.empty();
        }

        RequestDataReference parsed;
        try {
            parsed = RequestDataReference.parse(reference);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }

        Integer connectorId = parsed.getCtorId() != null ? parsed.getCtorId() : ownConnectorId;

        return connectorId == null
                ? Optional.empty()
                : Optional.of(new ConnectorField(connectorId, parsed.getKey()));
    }

    private static ReferenceType typeOf(String reference) {
        try {
            return ReferenceParser.parse(reference).getType();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Set<String> fieldNamesOf(int connectorId) {
        Optional<Connector> connector = connectorService.findById(connectorId);
        if (connector.isEmpty()) {
            return Set.of();
        }

        Set<String> names = new HashSet<>();
        if (connector.get().getRequestData() != null) {
            connector.get().getRequestData().forEach(data -> names.add(data.getField()));
        }

        String invokerName = connector.get().getInvoker();
        if (invokerService.existsByName(invokerName)) {
            invokerService.findByName(invokerName).getRequiredData().forEach(data -> names.add(data.getName()));
        }

        return names;
    }

    /**
     * Returns the fields of {@code connector} that are not public: what the connector screen does
     * not show in plain text. The invoker's definition wins over the stored one.
     */
    private Set<String> hiddenFieldsOf(Connector connector) {
        Map<String, String> visibilityByField = new HashMap<>();
        if (connector.getRequestData() != null) {
            connector.getRequestData().forEach(data -> visibilityByField.put(data.getField(), data.getVisibility()));
        }

        Invoker invoker = invokerService.findByName(connector.getInvoker());
        invoker.getRequiredData().forEach(data -> visibilityByField.put(data.getName(), data.getVisibility()));

        return visibilityByField.entrySet().stream()
                .filter(entry -> !PUBLIC_VISIBILITY.equals(entry.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    private static RequestEntity<?> buildRequest(
            OperationDTO operation,
            Map<String, Object> staticValues,
            Map<Integer, MethodConnectorEx> connectors) {
        Map<Integer, Map<String, String>> requestData = new HashMap<>();
        connectors.forEach((id, connector) -> requestData.put(id, connector.getRequiredData()));

        ExecutionManager executionManager = new ExecutionManagerImpl(
                Map.of(), List.of(), requestData, Map.of(), Map.of(),
                manager -> new StaticValueExtractor(staticValues, new ReferenceExtractor(manager)));
        executionManager.setCurrentCtorId(operation.getConnectorId());

        try {
            return RequestEntityBuilder.start()
                    .forOperation(operation)
                    .usingReferences(executionManager::getValue)
                    .createRequest();
        } catch (RuntimeException e) {
            throw new GeneralServiceException(
                    HttpStatus.BAD_REQUEST,
                    ExceptionConstant.METHOD_TEST_REQUEST_NOT_BUILT,
                    "The request could not be built: " + e.getMessage());
        }
    }

    private RestTemplate newRestTemplate(MethodConnectorEx connector) {
        boolean sslCert = connector != null && connector.isSslCert();
        int timeout = connector != null ? connector.getTimeout() : 0;

        RestCustomizer customizer = new RestCustomizer(
                environment.getProperty(AppYamlPath.PROXY_HOST, ""),
                environment.getProperty(AppYamlPath.PROXY_PORT, ""),
                environment.getProperty(AppYamlPath.PROXY_USER, ""),
                environment.getProperty(AppYamlPath.PROXY_PASS, ""),
                sslCert,
                timeout);

        return new RestTemplateBuilder(customizer).build();
    }

    private static SentRequest toSentRequest(RequestEntity<?> request, Set<String> secrets) {
        // longest first, so a secret containing another one is masked as a whole
        List<String> ordered = secrets.stream()
                .sorted(Comparator.comparingInt(String::length).reversed())
                .toList();
        UnaryOperator<String> mask = text -> mask(text, ordered);

        Map<String, List<String>> headers = new LinkedHashMap<>();
        request.getHeaders().forEach((name, values) -> headers.put(name, values.stream().map(mask).toList()));

        return new SentRequest(
                request.getMethod().name(),
                mask.apply(request.getUrl().toString()),
                headers,
                maskBody(request.getBody(), mask));
    }

    private static Object maskBody(Object body, UnaryOperator<String> mask) {
        if (body == null) {
            return null;
        }

        if (body instanceof MultiValueMap<?, ?> form) {
            Map<String, List<String>> fields = new LinkedHashMap<>();
            form.forEach((name, values) -> fields.put(
                    String.valueOf(name),
                    values.stream().map(value -> mask.apply(String.valueOf(value))).toList()));

            return fields;
        }

        return mask.apply(body.toString());
    }

    private static String mask(String text, List<String> secrets) {
        String masked = text;
        for (String secret : secrets) {
            masked = masked.replace(secret, MASK);
        }

        return masked;
    }

    private static ReceivedResponse toReceivedResponse(ResponseEntity<?> response) {
        Map<String, List<String>> headers = new LinkedHashMap<>();
        response.getHeaders().forEach((name, values) -> headers.put(name, List.copyOf(values)));

        Object body = response.getBody() instanceof byte[] bytes
                ? Base64.getEncoder().encodeToString(bytes)
                : response.getBody();

        return new ReceivedResponse(response.getStatusCode().value(), headers, body);
    }

    private record ConnectorField(int connectorId, String key) {}

    /**
     * The request of a method, ready to send.
     *
     * @param request the built request; {@code null} when a connector could not be read
     * @param ownConnector the method's own connector; {@code null} for a pure HTTP request
     * @param secrets the non-public values of the connectors that were read
     * @param connectorErrors why connectors could not be read; empty when the request is built
     */
    private record PreparedRequest(
            RequestEntity<?> request,
            MethodConnectorEx ownConnector,
            Set<String> secrets,
            List<ConnectorError> connectorErrors) {

        static PreparedRequest failed(List<ConnectorError> connectorErrors) {
            return new PreparedRequest(null, null, Set.of(), List.copyOf(connectorErrors));
        }
    }
}
