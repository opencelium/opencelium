package com.becon.opencelium.backend.database.mongodb.dao;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.criteria.ConnectionCriteria;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.service.MethodMngService;
import com.becon.opencelium.backend.database.mongodb.service.OperatorMngService;
import com.becon.opencelium.backend.database.mongodb.service.MapperMngService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.partialconnection.FlowchartCreateRequest;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;

@Component
public class ConnectionMngDAOImpl implements ConnectionMngDAO {

    private final MongoTemplate mongoTemplate;
    private final MethodMngService methodMngService;
    private final OperatorMngService operatorMngService;
    private final MapperMngService mapperMngService;

    public ConnectionMngDAOImpl(MongoTemplate mongoTemplate, MethodMngService methodMngService, OperatorMngService operatorMngService, MapperMngService mapperMngService) {
        this.mongoTemplate = mongoTemplate;
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
        this.mapperMngService = mapperMngService;
    }

    @Override
    public MethodMng pushNewMethod(Long connectionId, String flowId, MethodMng entity) {
        checkConnection(connectionId);

        checkFlowchart(connectionId, flowId);

        entity.setId(null);
        MethodMng savedMethod = methodMngService.save(entity);

        Query flowchartQuery = new Query(Criteria
                .where("connection_id").is(connectionId)
                .and("flowcharts.flowId").is(flowId));

        mongoTemplate.updateFirst(
                flowchartQuery,
                new Update().push("flowcharts.$.methods", savedMethod),
                ConnectionMng.class
        );

        return savedMethod;
    }

    @Override
    public OperatorMng pushNewOperator(Long connectionId, String flowId, OperatorMng operatorMng) {
        checkConnection(connectionId);

        checkFlowchart(connectionId, flowId);

        operatorMng.setId(null);
        OperatorMng savedOperator = operatorMngService.save(operatorMng);

        Query flowchartQuery = new Query(Criteria
                .where("connection_id").is(connectionId)
                .and("flowcharts.flowId").is(flowId));

        mongoTemplate.updateFirst(
                flowchartQuery,
                new Update().push("flowcharts.$.operators", savedOperator),
                ConnectionMng.class
        );

        return savedOperator;
    }

    @Override
    public void removeMapper(Long connectionId, String fbId) {

        Query query = new Query(Criteria
                .where("connection_id").is(connectionId));

        Update update = new Update()
                .pull("mappers", Query.query(Criteria.where("$id").is(new ObjectId(fbId))));

        mongoTemplate.updateFirst(query, update, ConnectionMng.class);

        mapperMngService.delete(fbId);
    }

    @Override
    public void removeOperator(Long connectionId, String flowId, String operatorId) {
        checkConnection(connectionId);

        Query query = new Query(Criteria
                .where("connection_id").is(connectionId)
                .and("flowcharts.flowId").is(flowId));

        Update update = new Update()
                .pull("flowcharts.$.operators",
                        Query.query(Criteria.where("$id").is(new ObjectId(operatorId))));

        mongoTemplate.updateFirst(query, update, ConnectionMng.class);

        operatorMngService.delete(operatorId);
    }

    @Override
    public void removeMethod(Long connectionId, String flowId, String methodId) {
        checkConnection(connectionId);

        Query query = new Query(Criteria
                .where("connection_id").is(connectionId)
                .and("flowcharts.flowId").is(flowId));

        Update update = new Update()
                .pull("flowcharts.$.methods",
                        Query.query(Criteria.where("$id").is(new ObjectId(methodId))));

        mongoTemplate.updateFirst(query, update, ConnectionMng.class);

        operatorMngService.delete(methodId);
    }

    @Override
    public FlowchartMng addFlowchart(FlowchartCreateRequest request) {
        checkConnection(request.getConnectionId());

        FlowchartMng flowchart = new FlowchartMng();
        flowchart.setConnectorId(request.getConnectorId());
        flowchart.setFlowId(UUID.randomUUID().toString());
        flowchart.setTitle(request.getTitle());
        flowchart.setMethods(Collections.emptyList());
        flowchart.setOperators(Collections.emptyList());

        Query query = new Query(Criteria.where("connection_id").is(request.getConnectionId()));

        Update update = new Update()
                .push("flowcharts", flowchart)
                .push("execution_plan.steps", flowchart.getFlowId());

        mongoTemplate.updateFirst(query, update, ConnectionMng.class);

        return flowchart;
    }

    @Override
    public MapperMng pushNewMapperAndUpdatePlan(Long connectionId, MapperMng mapper, ExecutionPlanMng executionPlan) {
        checkConnection(connectionId);

        mapper.setId(null);
        MapperMng saved = mapperMngService.save(mapper);

        Query flowchartQuery = new Query(Criteria
                .where("connection_id").is(connectionId));

        mongoTemplate.updateFirst(
                flowchartQuery,
                new Update()
                        .push("mappers", saved)
                        .set("execution_plan", executionPlan),
                ConnectionMng.class
        );

        return saved;
    }

    @Override
    public void updateExecutionPlan(Long connectionId, ExecutionPlanMng executionPlan) {
        Query flowchartQuery = new Query(Criteria
                .where("connection_id").is(connectionId));

        mongoTemplate.updateFirst(
                flowchartQuery,
                new Update().set("execution_plan", executionPlan),
                ConnectionMng.class
        );
    }

    @Override
    public void update(ConnectionMng connectionMng) {
        Query flowchartQuery = new Query(Criteria
                .where("connection_id").is(connectionMng.getConnectionId()));

        mongoTemplate.updateFirst(
                flowchartQuery,
                new Update().set("ui", connectionMng.getUi()),
                ConnectionMng.class
        );
    }

    @Override
    public ConnectionMng getConnection(Long connectionId, ConnectionCriteria criteria) {
        Query query = new Query(Criteria.where("connection_id").is(connectionId));
        includeFields(query, criteria);

        ConnectionMng connection = mongoTemplate.findOne(query, ConnectionMng.class);

        if (connection == null) {
            throw new GeneralServiceException(
                    ExceptionConstant.INVALID_DATA,
                    "Connection not found - " + connectionId
            );
        }

        return connection;
    }

    private void includeFields(Query query, ConnectionCriteria criteria) {
        var fields = query.fields();

        fields.include("_id").include("connection_id");

        if (criteria.isMethods()) {
            query.fields().include("flowcharts.methods");
        } else if (criteria.isFlowcharts()) {
            query.fields().include("flowcharts");
        }

        if (criteria.isExecutionPlan()) {
            fields.include("execution_plan");
        }

        if (criteria.isMappers()) {
            fields.include("mappers");
        }

        if (criteria.isUi()) {
            fields.include("ui");
        }
    }


    @Override
    public boolean existsConnection(Long connectionId) {
        Query query = new Query(Criteria.where("connection_id").is(connectionId));
        return mongoTemplate.exists(query, ConnectionMng.class);
    }

    @Override
    public boolean existsFlowchart(Long connectionId, String flowId) {
        Query query = new Query(Criteria
                .where("connection_id").is(connectionId)
                .and("flowcharts.flowId").is(flowId));

        return mongoTemplate.exists(query, ConnectionMng.class);
    }

    @Override
    public void checkConnection(Long connectionId) {
        if (!existsConnection(connectionId)) {
            throw new GeneralServiceException(
                    ExceptionConstant.INVALID_DATA,
                    "Connection not found - " + connectionId
            );
        }
    }

    @Override
    public void checkFlowchart(Long connectionId, String flowId) {
        if (!existsFlowchart(connectionId, flowId)) {
            throw new GeneralServiceException(
                    ExceptionConstant.INVALID_DATA,
                    "Flowchart not found - " + flowId
            );
        }
    }
}
