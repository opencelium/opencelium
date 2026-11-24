package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.enums.DataRef;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.execution.globalvariable.GlobalConnectorValues;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.rdata.ConnectorTokenCache;
import com.becon.opencelium.backend.execution.rdata.RequiredDataService;
import com.becon.opencelium.backend.execution.rdata.RequiredDataServiceImp;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.MethodConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Component
public class ConnectorExMapper {
    private final ConnectorService connectorService;
    private final OperationExMapper operationExMapper;
    private final OperatorExMapper operatorExMapper;
    private final InvokerService invokerService;

    public ConnectorExMapper(
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            OperationExMapper operationExMapper,
            OperatorExMapper operatorExMapper,
            @Qualifier("invokerServiceImp") InvokerService invokerService
    ) {
        this.connectorService = connectorService;
        this.operationExMapper = operationExMapper;
        this.operatorExMapper = operatorExMapper;
        this.invokerService = invokerService;
    }

    /**
     * @param globals the global variables of the run: a connector field that holds a reference
     *                gets its value from them
     */
    ConnectorEx toEntity(ConnectorMng dto, GlobalVariableSnapshot globals) {
        if (dto == null) return null;
        ConnectorEx connectorEx = new ConnectorEx();
        if(!Objects.equals(ConnectionConstants.DEFAULT_CONNECTOR_ID, dto.getConnectorId())){
            Connector connector = connectorService.getById(dto.getConnectorId());
            List<RequestData> requestData = connector.getRequestData();

            Invoker invoker = invokerService.findByName(connector.getInvoker());
            invoker.getRequiredData().forEach(rd -> {
                if (requestData.stream().noneMatch(rqsd -> rqsd.getField().equals(rd.getName()))) {
                    requestData.add(new RequestData(rd));
                }
            });

            // before the fields are computed: what follows must see values, not references
            GlobalConnectorValues.resolve(requestData, () -> globals);

            RequiredDataService requiredDataService = new RequiredDataServiceImp(connector,requestData, invoker.getOperations());
            requestData.forEach(rqsd -> {
                String value = requiredDataService.getValue(rqsd).orElse(null);
                rqsd.setValue(value);
            });

            Map<String, String> map = new HashMap<>();
            requestData.forEach(r -> map.put(r.getField(), r.getValue()));

            connectorEx.setSslCert(connector.isTrustCertificate());
            connectorEx.setInvoker(connector.getInvoker());
            connectorEx.setRequiredData(map);

            connectorEx.setMethods(operationExMapper.toOperationAll(dto.getMethods(), connector.getInvoker()));
            setPagination(connectorEx, invoker);
        } else {
            connectorEx.setMethods(operationExMapper.toOperationAll(dto.getMethods(), null));
            connectorEx.setInvoker(ConnectionConstants.DEFAULT_INVOKER_NAME);
        }

        connectorEx.setName(dto.getTitle());
        connectorEx.setId(dto.getConnectorId());
        connectorEx.setFchartId(dto.getFlowId());
        connectorEx.setOperators(operatorExMapper.toEntityAll(dto.getOperators()));

        return connectorEx;
    }

    // Builds the connectors map for multi-connector connections. Collects unique connectorIds
    // from methods that carry their own connector reference, loads each once, and returns a map
    // keyed by connector ID for fast lookup during execution.
    Map<Integer, MethodConnectorEx> toMethodConnectorMap(ConnectorMng fromConnector, GlobalVariableSnapshot globals) {
        if (fromConnector == null || fromConnector.getMethods() == null) {
            return Map.of();
        }
        Map<Integer, MethodConnectorEx> result = new HashMap<>();
        fromConnector.getMethods().stream()
                .filter(m -> m.getConnector() != null && m.getConnector().getConnectorId() != null)
                .map(MethodMng::getConnector)
                .collect(Collectors.toMap(
                        MethodConnectorMng::getConnectorId,
                        MethodConnectorMng::getConnectorId,
                        (a, b) -> a))
                .keySet()
                .forEach(connectorId -> result.put(
                        connectorId, toMethodConnector(connectorService.getById(connectorId), () -> globals)));
        return result;
    }

    /**
     * Builds the execution view of {@code connector} with its required data resolved.
     *
     * <p>Resolving the required data calls the invoker's functions when a field is computed from
     * another request, e.g. an authentication token, so this sends real requests to the API.
     * The request data of {@code connector} is completed with the invoker's missing fields and
     * overwritten with the resolved values.
     *
     * <p>A field that holds global variable references gets their values first, so a computed
     * field is asked for with real values.
     *
     * @param globals gives the global variables to read: the snapshot of the run, or outside a
     *                run the variables open to all workflows as they are now; asked only if a
     *                field holds a reference
     * @throws com.becon.opencelium.backend.exception.GlobalVariableNotFoundException if a field
     *         references a variable that does not exist or is not open to all workflows
     */
    public MethodConnectorEx toMethodConnector(Connector connector, Supplier<GlobalVariableSnapshot> globals) {
        Invoker invoker = invokerService.findByName(connector.getInvoker());
        List<RequestData> requestData = completeRequestData(connector, invoker, globals);
        computeFields(connector, invoker, requestData, Map.of());
        return toMethodConnectorEx(connector, invoker, requestData);
    }

    /**
     * Like {@link #toMethodConnector(Connector, Supplier)}, but a field computed by calling an
     * invoker function (e.g. a token from the login response) is taken from {@code tokenCache}
     * when the cache holds it for the connector's current fields, so no request is sent for it.
     * Otherwise it is requested as usual and cached, unless one of them comes back empty.
     *
     * <p>For requests made on demand only: a workflow run computes the fields every time.
     */
    public MethodConnectorEx toMethodConnector(
            Connector connector, Supplier<GlobalVariableSnapshot> globals, ConnectorTokenCache tokenCache) {
        Invoker invoker = invokerService.findByName(connector.getInvoker());
        List<RequestData> requestData = completeRequestData(connector, invoker, globals);

        String fingerprint = ConnectorTokenCache.fingerprintOf(connector, requestData);
        Set<String> requestedFields = requestData.stream()
                .filter(data -> data.getValue() != null && DataRef.getType(data.getValue()) == DataRef.BODY)
                .map(RequestData::getField)
                .collect(Collectors.toSet());
        Optional<Map<String, String>> cached = tokenCache.find(connector.getId(), fingerprint);

        computeFields(connector, invoker, requestData, cached.orElse(Map.of()));

        if (cached.isEmpty() && !requestedFields.isEmpty()) {
            Map<String, String> requested = requestData.stream()
                    .filter(data -> requestedFields.contains(data.getField()))
                    .filter(data -> StringUtils.isNotBlank(data.getValue()))
                    .collect(Collectors.toMap(RequestData::getField, RequestData::getValue));
            if (requested.size() == requestedFields.size()) {
                tokenCache.put(connector.getId(), fingerprint, requested);
            }
        }
        return toMethodConnectorEx(connector, invoker, requestData);
    }

    /**
     * Completes the request data of {@code connector} with the invoker's missing fields and gives
     * a field that holds global variable references their values.
     */
    private static List<RequestData> completeRequestData(
            Connector connector, Invoker invoker, Supplier<GlobalVariableSnapshot> globals) {
        List<RequestData> requestData = connector.getRequestData();
        invoker.getRequiredData().forEach(rd -> {
            if (requestData.stream().noneMatch(rqsd -> rqsd.getField().equals(rd.getName()))) {
                requestData.add(new RequestData(rd));
            }
        });
        GlobalConnectorValues.resolve(requestData, globals);
        return requestData;
    }

    /**
     * Overwrites each field of {@code requestData} with its computed value: the one in
     * {@code knownValues} when it has one, otherwise the one {@link RequiredDataService} gives.
     */
    private static void computeFields(
            Connector connector, Invoker invoker, List<RequestData> requestData, Map<String, String> knownValues) {
        RequiredDataService requiredDataService =
                new RequiredDataServiceImp(connector, requestData, invoker.getOperations());
        requestData.forEach(rqsd -> rqsd.setValue(knownValues.containsKey(rqsd.getField())
                ? knownValues.get(rqsd.getField())
                : requiredDataService.getValue(rqsd).orElse(null)));
    }

    private static MethodConnectorEx toMethodConnectorEx(
            Connector connector, Invoker invoker, List<RequestData> requestData) {
        Map<String, String> requiredDataMap = new HashMap<>();
        requestData.forEach(r -> requiredDataMap.put(r.getField(), r.getValue()));

        MethodConnectorEx mcEx = new MethodConnectorEx();
        mcEx.setId(connector.getId());
        mcEx.setTitle(connector.getTitle());
        mcEx.setSslCert(connector.isTrustCertificate());
        mcEx.setTimeout(connector.getTimeout());
        mcEx.setInvoker(connector.getInvoker());
        mcEx.setRequiredData(requiredDataMap);
        mcEx.setPagination(invoker.getPagination());
        return mcEx;
    }

    private void setPagination(ConnectorEx connectorEx, Invoker invoker) {
        connectorEx.setPagination(invoker.getPagination());

        List<OperationDTO> operations = connectorEx.getMethods();

        for (OperationDTO operation : operations) {
            invoker.getOperations().stream()
                    .filter(f -> f.getName().equals(operation.getName()))
                    .findAny()
                    .ifPresentOrElse(ff -> {
                        if (ff.getType().equals("page")) {
                            if (ff.getPagination() == null) {
                                operation.setPagination(invoker.getPagination());
                            } else {
                                operation.setPagination(ff.getPagination());
                            }
                            operation.setOperationType(OpType.PAGINATION);
                        } else {
                            operation.setOperationType(OpType.fromValue(ff.getType()));
                        }
                    }, () -> {
                        throw new RuntimeException("Method not found with name: " + operation.getName());
                    });
        }
    }
}
