package com.becon.opencelium.backend.versionmanager.updaters;

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mongodb.service.ExecutionPlanService;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.mapper.v5.FlowchartMapper;
import com.becon.opencelium.backend.mapper.v5.MapperMapper;
import com.becon.opencelium.backend.utility.BindingUtility;
import com.becon.opencelium.backend.utility.ReferenceUtility;
import com.becon.opencelium.backend.versionmanager.ComplexUpdater;
import com.becon.opencelium.backend.versionmanager.HierarchicalVersionUpgrader;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import com.becon.opencelium.backend.versionmanager.connectionmng.Connection44MngUpdater;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ConnectionComplexUpdater implements ComplexUpdater {

    private static final Logger log = LoggerFactory.getLogger(ConnectionComplexUpdater.class);
    private final ConnectionService connectionService;
    private final OpenceliumProps openceliumProps;
    private final ConnectionMngService connectionMngService;
    private final EnhancementService enhancementService;
    private final FlowchartMapper flowchartMapper;
    private final ExecutionPlanService executionPlanService;
    private final MapperMapper mapperMapper;
    private final FieldBindingMngService fieldBindingMngService;
    private final HierarchicalVersionUpgrader<ConnectionMng> connectionUpgrader;

    public ConnectionComplexUpdater(ConnectionService connectionService, OpenceliumProps openceliumProps, ConnectionMngService connectionMngService, EnhancementService enhancementService, FlowchartMapper flowchartMapper, ExecutionPlanService executionPlanService, MapperMapper mapperMapper, FieldBindingMngService fieldBindingMngService, Connection44MngUpdater connection44MngUpdater) {
        this.connectionService = connectionService;
        this.openceliumProps = openceliumProps;
        this.connectionMngService = connectionMngService;
        this.enhancementService = enhancementService;
        this.flowchartMapper = flowchartMapper;
        this.executionPlanService = executionPlanService;
        this.mapperMapper = mapperMapper;
        this.fieldBindingMngService = fieldBindingMngService;
        this.connectionUpgrader = HierarchicalVersionUpgrader.<ConnectionMng>builder()
                .step("4.4", connection44MngUpdater::updateToCurrentVersion)
                .build();
    }

    @Override
    public void update() {
        List<Connection> connections = connectionService.findAll();

        for (Connection connection : connections) {
            try {
                update(connection);
                log.error("Connection[id={}, title={}] successfully updated to {} version", connection.getId(), connection.getTitle(), openceliumProps.getVersion());
            } catch (Exception e) {
                e.printStackTrace();
                log.error("Connection[id={}, title={}] updating failed", connection.getId(), connection.getTitle());
            }
        }
    }

    private void update(Connection connection) {
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(connection.getId());
        connectionMng = connectionUpgrader.upgradeFromVersion(connectionMng, connection.getOcVersion());

        if (Utils.compare(connection.getOcVersion(), openceliumProps.getVersion()) < 0) {

            connectionMng.setVersion(openceliumProps.getVersion());
            connection.setOcVersion(openceliumProps.getVersion());

            if (connectionMng.getFlowcharts() == null || connectionMng.getFlowcharts().isEmpty()) {

                List<FlowchartMng> flowcharts = new ArrayList<>(2);

                if (connectionMng.getFromConnector() != null) {
                    ConnectorMng fromConnector = connectionMng.getFromConnector();
                    flowcharts.add(flowchartMapper.fromConnector(fromConnector));
                    connectionMng.setFromConnector(null);
                }

                if (connectionMng.getToConnector() != null) {
                    ConnectorMng toConnector = connectionMng.getToConnector();
                    flowcharts.add(flowchartMapper.fromConnector(toConnector));
                    connectionMng.setToConnector(null);
                }

                ExecutionPlanMng executionPlan = executionPlanService.initNew();
                executionPlan.setSteps(flowcharts.stream().map(FlowchartMng::getFlowId).toList());

                connectionMng.setExecutionPlan(executionPlan);
                connectionMng.setFlowcharts(flowcharts);
            }

            List<Enhancement> enhancements = enhancementService.findAllByConnectionId(connection.getId());

            if (connectionMng.getFieldBindings() != null && !connectionMng.getFieldBindings().isEmpty()) {
                Map<Integer, Enhancement> enhancementMap = buildMap(enhancements);

                List<FieldBindingMng> fbs = connectionMng.getFieldBindings();
                List<MapperMng> mappers = new ArrayList<>();

                Map<String, MethodMng> methodColorMap = mapColorMethods(connectionMng.getFlowcharts());

                for (FieldBindingMng fb : fbs) {
                    Enhancement enhancement = enhancementMap.get(fb.getEnhancementId());

                    if (enhancement == null) {
                        throw new RuntimeException("Enhancement with id " + fb.getEnhancementId() + " not found");
                    }

                    EnhancementMng enhancementMng = new EnhancementMng();
                    enhancementMng.setTitle(enhancement.getTitle());
                    enhancementMng.setDescription(enhancement.getDescription());
                    enhancementMng.setArgs(enhancement.getArgs());
                    enhancementMng.setScript(enhancement.getScript());
                    enhancementMng.setLanguage(enhancement.getLanguage());

                    fb.setEnhancement(enhancementMng);

                    MapperMng mapperMng = mapperMapper.fromFb(fb);
                    mapperMng.setId(ObjectId.get().toHexString());
                    mappers.add(mapperMng);

                    replaceIds(methodColorMap, mapperMng, fb.getId());
                }

                connectionMng.setFieldBindings(null);
                connectionMng.setMappers(mappers);
            }

            enhancementService.deleteAll(enhancements.stream().map(Enhancement::getId).toList());
            connectionService.save(connection);
            connectionMngService.saveDirectly(connectionMng);
            fieldBindingMngService.deleteAll(connectionMng.getFieldBindings());
        }
    }

    private Map<String, MethodMng> mapColorMethods(List<FlowchartMng> flowcharts) {

        Map<String, MethodMng> methodColorMap = new HashMap<>();
        for (FlowchartMng flowchart : flowcharts) {
            for (MethodMng method : flowchart.getMethods()) {
                methodColorMap.put(method.getColor(), method);
            }
        }

        return methodColorMap;
    }

    private Map<Integer, Enhancement> buildMap(List<Enhancement> enhancements) {
        Map<Integer, Enhancement> map = new HashMap<>(enhancements.size());

        for (Enhancement enhancement : enhancements) {
            map.put(enhancement.getId(), enhancement);
        }

        return map;
    }

    private void replaceIds(Map<String, MethodMng> methods, MapperMng mapper, String oldId) {
        String resultVar = ReferenceUtility.extractResultVar(mapper.getArgs());
        String color = ReferenceUtility.extractColor(resultVar);

        MethodMng methodMng = methods.get(color);
        if (methodMng == null) {
            throw new RuntimeException("Method with color " + color + " not found");
        }

        BindingUtility.findAndReplaceId(methodMng, resultVar, oldId, mapper.getId());
    }
}
