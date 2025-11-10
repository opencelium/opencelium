package com.becon.opencelium.backend.database.mongodb.dao;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mongodb.service.MethodMngService;
import com.becon.opencelium.backend.database.mongodb.service.OperatorMngService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
public class ConnectionMngDAOImpl implements ConnectionMngDAO {

    private final MongoTemplate mongoTemplate;
    private final MethodMngService methodMngService;
    private final OperatorMngService operatorMngService;
    private final FieldBindingMngService fieldBindingMngService;

    public ConnectionMngDAOImpl(MongoTemplate mongoTemplate, MethodMngService methodMngService, OperatorMngService operatorMngService, FieldBindingMngService fieldBindingMngService) {
        this.mongoTemplate = mongoTemplate;
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
        this.fieldBindingMngService = fieldBindingMngService;
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
    public FieldBindingMng pushNewFieldBinding(Long connectionId, FieldBindingMng fb) {
        checkConnection(connectionId);

        fb.setId(null);
        FieldBindingMng saved = fieldBindingMngService.save(fb);

        Query flowchartQuery = new Query(Criteria
                .where("connection_id").is(connectionId));

        mongoTemplate.updateFirst(
                flowchartQuery,
                new Update().push("fieldBindings", saved),
                ConnectionMng.class
        );

        return saved;
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
        if (!existsFlowchart(connectionId,  flowId)) {
            throw new GeneralServiceException(
                    ExceptionConstant.INVALID_DATA,
                    "Flowchart not found - " + flowId
            );
        }
    }
}
