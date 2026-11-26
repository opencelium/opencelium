package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.CurlCommandBuilder;
import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.execution.ExecutionManagerImpl;
import com.becon.opencelium.backend.execution.OperationExchange;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.globalvariable.GlobalLoopSource;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.execution.oc721.StaticValueExtractor;
import com.becon.opencelium.backend.execution.rdata.ConnectorTokenCache;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.execution.ConnectorExMapper;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.reference.OperationReferenceCollector;
import com.becon.opencelium.backend.reference.ReferenceMatchers;
import com.becon.opencelium.backend.reference.ReferenceParser;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.reference.model.GlobalReference;
import com.becon.opencelium.backend.reference.model.RequestDataReference;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodCurlRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodCurlResultDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.ConnectorReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.GlobalVariableReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.StaticReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.ConnectorError;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.ReceivedResponse;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.SentRequest;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import com.becon.opencelium.backend.resource.execution.MethodConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Tests a single method by sending its request to the real API.
 *
 * <p>The method is built the way a connection execution builds it, so the request is the one the
 * execution would send. Its references are resolved by a {@link StaticValueExtractor}: request
 * data references are read from the connectors, global variable references from a snapshot of the
 * variables the user may use, every other reference takes the static value the user gave for it.
 * A static value always wins. The same request can be returned as a cURL command instead of being
 * sent.
 *
 * <p>A connector field that holds a global variable is read with the value the variable has now,
 * like wherever a connector is used outside a run: only variables open to all workflows.
 *
 * <p>A global variable the method itself references is read with its current value, cast the way
 * a run casts it, when the authenticated user may use it in the workflow of the method: the user
 * owns it, was granted it or is an admin, and the workflow is in its scope, the rule of the
 * reference picker. The sent request is shown to the user, so the test never reads any other
 * variable. A variable the test cannot read, and one whose path names the iterator of a loop,
 * which has no value outside a run, needs a static value like any other reference.
 *
 * <p>The echoed request hides what the user may use but not see: the values of the connector
 * fields that are not public, and the values of the secret global variables the test read, in
 * the method or through a connector field. A cURL command keeps the connector data, as it must
 * run, but hides the values of the secret global variables too: nobody may read a secret back,
 * not even its owner, so the user puts it into the command.
 *
 * <p>A request that writes is only sent when the user confirms it. Anything but {@code GET},
 * {@code HEAD} and {@code OPTIONS} writes, except a GraphQL request whose operation is a {@code
 * query}: GraphQL sends every operation with {@code POST}, so its query text tells a read from a
 * mutation. A GraphQL request whose operation cannot be told counts as a write.
 *
 * <p>A connector field computed by an invoker function, such as a token from a login, is kept in
 * the {@link ConnectorTokenCache}, so repeated tests, like the calls of the GraphQL body editor, do
 * not log in every time. When the API refuses the request (401, 403, or a GraphQL error caused by
 * an {@code AccessDeniedException}) and the method's connector has such a field, the cached value
 * is dropped and the request is sent once more after a new login.
 *
 * <p>Not transactional on purpose: the connectors are read detached and their decrypted request
 * data must never be flushed back to the database.
 */
@Service
public class MethodTestServiceImp implements MethodTestService {

    private static final Set<HttpMethod> READ_ONLY_METHODS =
            Set.of(HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS);
    private static final String PUBLIC_VISIBILITY = "public";

    private static final ObjectMapper JSON = new ObjectMapper();

    // the cause jdisc reports for a refused token; the GraphQL body editor checked the same
    private static final String ACCESS_DENIED_CAUSE = "AccessDeniedException";

    // block strings, strings and comments of a GraphQL document: their text is never syntax
    private static final Pattern GRAPHQL_IGNORED =
            Pattern.compile("\"\"\"(?:\\\\\"\"\"|[\\s\\S])*?\"\"\"|\"(?:\\\\.|[^\"\\\\\\r\\n])*\"|#[^\\r\\n]*");

    // the tokens that tell the operations of a GraphQL document apart: names and brackets
    private static final Pattern GRAPHQL_TOKEN = Pattern.compile("[_A-Za-z][_0-9A-Za-z]*|[{}()]");

    private final Environment environment;
    private final MethodMngMapper methodMngMapper;
    private final OperationExMapper operationExMapper;
    private final ConnectorExMapper connectorExMapper;
    private final ConnectorService connectorService;
    private final InvokerService invokerService;
    private final GlobalVariableSnapshotService globalVariableSnapshotService;
    private final GlobalVariableService globalVariableService;
    private final ConnectorTokenCache tokenCache;

    public MethodTestServiceImp(
            Environment environment,
            MethodMngMapper methodMngMapper,
            OperationExMapper operationExMapper,
            ConnectorExMapper connectorExMapper,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("invokerServiceImp") InvokerService invokerService,
            GlobalVariableSnapshotService globalVariableSnapshotService,
            GlobalVariableService globalVariableService,
            ConnectorTokenCache tokenCache) {
        this.environment = environment;
        this.methodMngMapper = methodMngMapper;
        this.operationExMapper = operationExMapper;
        this.connectorExMapper = connectorExMapper;
        this.connectorService = connectorService;
        this.invokerService = invokerService;
        this.globalVariableSnapshotService = globalVariableSnapshotService;
        this.globalVariableService = globalVariableService;
        this.tokenCache = tokenCache;
    }

    @Override
    public MethodTestReferencesDTO findReferences(MethodDTO method, Long connectionId, Integer categoryId) {
        requireOneWorkflow(connectionId, categoryId);
        OperationDTO operation = toOperation(method);
        Set<String> references = OperationReferenceCollector.collect(operation);
        GlobalVariableSnapshot globals = usableGlobals(references, connectionId, categoryId);

        Map<Integer, Set<String>> fieldsByConnector = new HashMap<>();
        List<ConnectorReference> connectorReferences = new ArrayList<>();
        List<StaticReference> staticReferences = new ArrayList<>();
        List<GlobalVariableReference> globalReferences = new ArrayList<>();

        for (String reference : references) {
            Optional<ConnectorField> field = connectorFieldOf(reference, operation.getConnectorId());
            Optional<GlobalReference> global = providedGlobal(reference, globals);

            if (field.isPresent()) {
                int connectorId = field.get().connectorId();
                String key = field.get().key();
                boolean available = fieldsByConnector
                        .computeIfAbsent(connectorId, this::fieldNamesOf)
                        .contains(key);

                connectorReferences.add(new ConnectorReference(reference, connectorId, key, available));
            } else if (global.isPresent()) {
                globalReferences.add(new GlobalVariableReference(reference, global.get().getName()));
            } else {
                staticReferences.add(new StaticReference(reference, typeOf(reference)));
            }
        }

        return new MethodTestReferencesDTO(connectorReferences, staticReferences, globalReferences);
    }

    @Override
    public MethodTestResultDTO test(MethodTestRequestDTO request, Long connectionId, Integer categoryId) {
        requireOneWorkflow(connectionId, categoryId);
        OperationDTO operation = toOperation(request.method());
        requireWriteConfirmed(request.method(), operation, request.confirmWrite());

        PreparedRequest prepared = prepare(operation, request.staticValues(), connectionId, categoryId);
        if (!prepared.connectorErrors().isEmpty()) {
            return MethodTestResultDTO.notSent(prepared.connectorErrors());
        }

        Exchange exchange = send(operation, prepared);

        // a computed token the API refuses is dropped, and the request is sent once more after a
        // new login; a connector without computed fields would send the same values again
        Integer ownConnectorId = operation.getConnectorId();
        if (ownConnectorId != null && isAccessDenied(exchange.response()) && tokenCache.evict(ownConnectorId)) {
            prepared = prepare(operation, request.staticValues(), connectionId, categoryId);
            if (!prepared.connectorErrors().isEmpty()) {
                return MethodTestResultDTO.notSent(prepared.connectorErrors());
            }
            exchange = send(operation, prepared);
        }

        return MethodTestResultDTO.sent(
                toSentRequest(prepared.request(), prepared.secrets()),
                toReceivedResponse(exchange.response()),
                exchange.durationMs());
    }

    private Exchange send(OperationDTO operation, PreparedRequest prepared) {
        RequestEntity<?> requestEntity = prepared.request();
        Class<?> responseType = OperationExchange.responseTypeOf(operation);
        RestTemplate restTemplate = newRestTemplate(prepared.ownConnector());

        long start = System.nanoTime();
        ResponseEntity<?> response =
                OperationExchange.exchange(restTemplate, requestEntity.getUrl(), requestEntity, responseType);
        long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);

        return new Exchange(response, durationMs);
    }

    /**
     * Whether the API refused the request for its credentials: 401, 403, or a GraphQL error whose
     * first cause is an {@code AccessDeniedException}, which GraphQL APIs such as jdisc answer
     * with status 200.
     */
    private static boolean isAccessDenied(ResponseEntity<?> response) {
        int status = response.getStatusCode().value();
        if (status == HttpStatus.UNAUTHORIZED.value() || status == HttpStatus.FORBIDDEN.value()) {
            return true;
        }

        return jsonOf(response.getBody())
                .map(body -> body.path("errors").path(0).path("extensions").path("causes").path(0).path("error"))
                .filter(cause -> ACCESS_DENIED_CAUSE.equals(cause.asText()))
                .isPresent();
    }

    private static Optional<JsonNode> jsonOf(Object body) {
        try {
            if (body instanceof String text) {
                return Optional.ofNullable(JSON.readTree(text));
            }
            if (body instanceof Map<?, ?> || body instanceof List<?>) {
                return Optional.of(JSON.valueToTree(body));
            }
        } catch (JsonProcessingException | IllegalArgumentException e) {
            // not JSON, so no GraphQL error
        }
        return Optional.empty();
    }

    @Override
    public MethodCurlResultDTO toCurl(MethodCurlRequestDTO request, Long connectionId, Integer categoryId) {
        requireOneWorkflow(connectionId, categoryId);
        OperationDTO operation = toOperation(request.method());

        PreparedRequest prepared = prepare(operation, request.staticValues(), connectionId, categoryId);
        if (!prepared.connectorErrors().isEmpty()) {
            return MethodCurlResultDTO.notBuilt(prepared.connectorErrors());
        }

        MethodConnectorEx ownConnector = prepared.ownConnector();
        String curl = CurlCommandBuilder.forRequest(withHidden(prepared.request(), prepared.globalSecrets()))
                .insecure(ownConnector != null && ownConnector.isSslCert())
                .connectTimeoutMillis(ownConnector != null ? ownConnector.getTimeout() : 0)
                .build();

        return MethodCurlResultDTO.built(curl);
    }

    /**
     * Reads the connectors and the global variables the request of {@code operation} needs and
     * builds the request, the way a connection execution would build it. Sends no request of its
     * own, but reading connector data can, e.g. to obtain a token.
     *
     * @return the built request, or only the connector errors when a connector cannot be read
     */
    private PreparedRequest prepare(
            OperationDTO operation, Map<String, Object> staticValues, Long connectionId, Integer categoryId) {
        List<String> unresolved = OperationReferenceCollector.collect(operation).stream()
                .filter(reference -> !staticValues.containsKey(reference))
                .toList();
        GlobalVariableSnapshot globals = usableGlobals(unresolved, connectionId, categoryId);
        Set<Integer> connectorIds = connectorsToRead(operation, unresolved, globals);

        Map<Integer, MethodConnectorEx> connectors = new HashMap<>();
        Set<String> globalSecrets = new HashSet<>(globals.secretTexts());
        Set<String> secrets = new HashSet<>(globalSecrets);
        List<ConnectorError> errors = new ArrayList<>();

        for (Integer connectorId : connectorIds) {
            try {
                Connector connector = connectorService.getById(connectorId);
                Set<String> hiddenFields = hiddenFieldsOf(connector);
                // no workflow runs in a test: a connector field that holds a global variable
                // gets the value the variable has now, and a public field may hold a secret
                MethodConnectorEx resolved = connectorExMapper.toMethodConnector(connector, () -> {
                    GlobalVariableSnapshot openToAll = globalVariableSnapshotService.takeOpenToAll();
                    globalSecrets.addAll(openToAll.secretTexts());
                    secrets.addAll(openToAll.secretTexts());
                    return openToAll;
                }, tokenCache);

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
                buildRequest(operation, staticValues, connectors, globals),
                connectors.get(operation.getConnectorId()),
                secrets,
                globalSecrets,
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

    private static void requireOneWorkflow(Long connectionId, Integer categoryId) {
        if (connectionId == null || categoryId == null) {
            return;
        }

        throw new GeneralServiceException(
                HttpStatus.BAD_REQUEST,
                ExceptionConstant.METHOD_TEST_WORKFLOW_AMBIGUOUS,
                "Give connectionId for a saved workflow or categoryId for one that is not saved yet, not both.");
    }

    private static void requireWriteConfirmed(MethodDTO method, OperationDTO operation, boolean confirmWrite) {
        if (confirmWrite || READ_ONLY_METHODS.contains(operation.getHttpMethod())) {
            return;
        }

        Optional<GraphQlOperationType> graphQlOperation = graphQlOperationTypeOf(method);
        if (graphQlOperation.filter(type -> type == GraphQlOperationType.QUERY).isPresent()) {
            return;
        }

        String sent = graphQlOperation
                .map(type -> "a GraphQL " + type.description)
                .orElseGet(() -> "a %s request".formatted(operation.getHttpMethod().name()));
        throw new GeneralServiceException(
                HttpStatus.BAD_REQUEST,
                ExceptionConstant.METHOD_TEST_WRITE_NOT_CONFIRMED,
                "The method sends %s to the real API. Set confirmWrite to true to send it.".formatted(sent));
    }

    /** The type of the GraphQL operation {@code method} runs; empty when its body is not GraphQL. */
    private static Optional<GraphQlOperationType> graphQlOperationTypeOf(MethodDTO method) {
        BodyDTO body = method.getRequest().getBody();
        if (body == null
                || !ConnectionConstants.GRAPHQL_BODY_DATA.equals(body.getData())
                || body.getFields() == null) {
            return Optional.empty();
        }

        Object query = body.getFields().get(ConnectionConstants.GRAPHQL_QUERY_FIELD);
        Object operationName = body.getFields().get(ConnectionConstants.GRAPHQL_OPERATION_NAME_FIELD);
        if (!(query instanceof String document)) {
            return Optional.of(GraphQlOperationType.UNKNOWN);
        }

        return Optional.of(operationTypeOf(document, operationName instanceof String name ? name : null));
    }

    /**
     * Reads the type of the operation a GraphQL document runs: the one named {@code
     * operationName}, or else its only operation. Strings and comments are skipped, and only names
     * outside any bracket are read, so fields, arguments and fragments never count.
     */
    private static GraphQlOperationType operationTypeOf(String document, String operationName) {
        Matcher token = GRAPHQL_TOKEN.matcher(GRAPHQL_IGNORED.matcher(document).replaceAll(" "));
        List<GraphQlOperation> operations = new ArrayList<>();
        int depth = 0;
        GraphQlOperationType declared = null;
        String name = null;
        boolean fragment = false;

        while (token.find()) {
            String text = token.group();
            if (text.equals("{") || text.equals("(")) {
                // a selection set opened at the top ends the definition before it
                if (depth == 0 && text.equals("{")) {
                    if (declared != null) {
                        operations.add(new GraphQlOperation(name, declared));
                    } else if (!fragment) {
                        // the shorthand "{ ... }" is a query
                        operations.add(new GraphQlOperation(null, GraphQlOperationType.QUERY));
                    }
                    declared = null;
                    name = null;
                    fragment = false;
                }
                depth++;
            } else if (text.equals("}") || text.equals(")")) {
                depth = Math.max(0, depth - 1);
            } else if (depth == 0 && declared == null && !fragment) {
                declared = GraphQlOperationType.ofKeyword(text).orElse(null);
                fragment = text.equals("fragment");
            } else if (depth == 0 && declared != null && name == null) {
                name = text;
            }
        }

        if (operationName == null || operationName.isBlank()) {
            return operations.size() == 1 ? operations.get(0).type() : GraphQlOperationType.UNKNOWN;
        }

        return operations.stream()
                .filter(operation -> operationName.equals(operation.name()))
                .map(GraphQlOperation::type)
                .findFirst()
                .orElse(GraphQlOperationType.UNKNOWN);
    }

    /**
     * Returns the connectors whose data the request needs: the method's own connector, and every
     * connector referenced by a request data reference without a static value.
     *
     * @param unresolved the references of the method that have no static value
     * @param globals the global variables the test may read
     * @throws GeneralServiceException when a reference without a static value is neither connector
     *     data nor a global variable the test provides
     */
    private static Set<Integer> connectorsToRead(
            OperationDTO operation, List<String> unresolved, GlobalVariableSnapshot globals) {
        Set<Integer> connectorIds = new LinkedHashSet<>();
        if (operation.getConnectorId() != null) {
            connectorIds.add(operation.getConnectorId());
        }

        List<String> missing = new ArrayList<>();
        for (String reference : unresolved) {
            Optional<ConnectorField> field = connectorFieldOf(reference, operation.getConnectorId());

            if (field.isPresent()) {
                connectorIds.add(field.get().connectorId());
            } else if (providedGlobal(reference, globals).isEmpty()) {
                missing.add(reference);
            }
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

    /**
     * Takes the snapshot of the variables the user may use in the workflow of the method, but only
     * when one of {@code references} is a global variable reference a test can resolve; otherwise
     * reads nothing.
     */
    private GlobalVariableSnapshot usableGlobals(
            Collection<String> references, Long connectionId, Integer categoryId) {
        boolean readsGlobals = references.stream()
                .map(MethodTestServiceImp::resolvableGlobal)
                .anyMatch(Optional::isPresent);
        if (!readsGlobals) {
            return GlobalVariableSnapshot.empty();
        }

        return globalVariableSnapshotService.takeOf(globalVariableService.findUsable(connectionId, categoryId));
    }

    /**
     * Returns the global variable reference {@code reference} is, when the test provides its value:
     * a test can resolve it and {@code globals} holds its variable.
     */
    private static Optional<GlobalReference> providedGlobal(String reference, GlobalVariableSnapshot globals) {
        return resolvableGlobal(reference).filter(global -> globals.find(global.getName()).isPresent());
    }

    /**
     * Parses {@code reference} when it is a global variable reference a test can resolve at all.
     * No loop runs in a test, so a path that names the iterator of a loop has no value.
     */
    private static Optional<GlobalReference> resolvableGlobal(String reference) {
        if (!ReferenceMatchers.isGlobal(reference)) {
            return Optional.empty();
        }

        GlobalReference global;
        try {
            global = GlobalReference.parse(reference);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }

        boolean namesLoopIterator = global.getPath().filter(GlobalLoopSource::namesIterator).isPresent();

        return namesLoopIterator ? Optional.empty() : Optional.of(global);
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
            Map<Integer, MethodConnectorEx> connectors,
            GlobalVariableSnapshot globals) {
        Map<Integer, Map<String, String>> requestData = new HashMap<>();
        connectors.forEach((id, connector) -> requestData.put(id, connector.getRequiredData()));

        ExecutionManager executionManager = new ExecutionManagerImpl(
                Map.of(), List.of(), requestData, Map.of(), Map.of(), globals,
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

    /**
     * Returns {@code request} with {@code texts} hidden in its URL, headers and text or form body.
     * Hidden before the cURL command is built, because the command encodes and quotes the values.
     */
    private static RequestEntity<Object> withHidden(RequestEntity<?> request, Set<String> texts) {
        if (texts.isEmpty()) {
            return new RequestEntity<>(request.getBody(), request.getHeaders(), request.getMethod(), request.getUrl());
        }

        UnaryOperator<String> mask = text -> OcLogger.hideIn(text, texts);

        HttpHeaders headers = new HttpHeaders();
        request.getHeaders().forEach((name, values) -> headers.put(name, values.stream().map(mask).toList()));

        Object body = request.getBody();
        if (body instanceof MultiValueMap<?, ?> form) {
            MultiValueMap<String, Object> hiddenForm = new LinkedMultiValueMap<>();
            form.forEach((name, values) -> values.forEach(value -> hiddenForm.add(
                    String.valueOf(name), value == null ? null : mask.apply(String.valueOf(value)))));
            body = hiddenForm;
        } else if (body instanceof String text) {
            body = mask.apply(text);
        }

        return new RequestEntity<>(
                body, headers, request.getMethod(), URI.create(mask.apply(request.getUrl().toString())));
    }

    private static SentRequest toSentRequest(RequestEntity<?> request, Set<String> secrets) {
        // the rule a run log follows: longest first, and inside Basic credentials too
        UnaryOperator<String> mask = text -> OcLogger.hideIn(text, secrets);

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

    private static ReceivedResponse toReceivedResponse(ResponseEntity<?> response) {
        Map<String, List<String>> headers = new LinkedHashMap<>();
        response.getHeaders().forEach((name, values) -> headers.put(name, List.copyOf(values)));

        Object body = response.getBody() instanceof byte[] bytes
                ? Base64.getEncoder().encodeToString(bytes)
                : response.getBody();

        return new ReceivedResponse(response.getStatusCode().value(), headers, body);
    }

    private record ConnectorField(int connectorId, String key) {}

    private record Exchange(ResponseEntity<?> response, long durationMs) {}

    private record GraphQlOperation(String name, GraphQlOperationType type) {}

    /** The type of a GraphQL operation; {@link #UNKNOWN} when the query text does not tell it. */
    private enum GraphQlOperationType {
        QUERY("query"),
        MUTATION("mutation"),
        SUBSCRIPTION("subscription"),
        UNKNOWN("operation that is not recognised as a query");

        private final String description;

        GraphQlOperationType(String description) {
            this.description = description;
        }

        /** The type a definition keyword such as {@code mutation} starts; empty for any other name. */
        static Optional<GraphQlOperationType> ofKeyword(String keyword) {
            return switch (keyword) {
                case "query" -> Optional.of(QUERY);
                case "mutation" -> Optional.of(MUTATION);
                case "subscription" -> Optional.of(SUBSCRIPTION);
                default -> Optional.empty();
            };
        }
    }

    /**
     * The request of a method, ready to send.
     *
     * @param request the built request; {@code null} when a connector could not be read
     * @param ownConnector the method's own connector; {@code null} for a pure HTTP request
     * @param secrets the texts the echoed request hides: the non-public values of the connectors
     *     that were read and the values of the secret global variables the test read
     * @param connectorErrors why connectors could not be read; empty when the request is built
     */
    /**
     * A built request and what showing it must hide.
     *
     * @param secrets       the texts the echoed request hides: secret global variables and the
     *                      connector fields that are not public
     * @param globalSecrets the texts a cURL command hides: secret global variables only
     */
    private record PreparedRequest(
            RequestEntity<?> request,
            MethodConnectorEx ownConnector,
            Set<String> secrets,
            Set<String> globalSecrets,
            List<ConnectorError> connectorErrors) {

        static PreparedRequest failed(List<ConnectorError> connectorErrors) {
            return new PreparedRequest(null, null, Set.of(), Set.of(), List.copyOf(connectorErrors));
        }
    }
}
