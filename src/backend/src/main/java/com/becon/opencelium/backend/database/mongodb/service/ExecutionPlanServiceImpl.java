package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.criteria.ConnectionCriteria;
import com.becon.opencelium.backend.database.mongodb.dao.ConnectionMngDAO;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.flowchart.*;
import com.becon.opencelium.backend.mapper.v5.ExecutionPlanMapper;
import com.becon.opencelium.backend.resource.connection.v5.ExecutionPlanDTO;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component("executionPlanServiceImpl")
public class ExecutionPlanServiceImpl implements ExecutionPlanService {

    private final ConnectionMngDAO connectionMngDAO;
    private final ExecutionPlanMapper executionPlanMapper;

    private static final String MODE_SEQUENTIAL = "SEQUENTIAL";
    private static final String STRATEGY_STOP = "STOP";
    private static final Long RETRY_BACKOFF_MS = 5000L;
    private static final Integer RETRY_MAX_ATTEMPTS = 1;

    public ExecutionPlanServiceImpl(@Lazy ConnectionMngDAO connectionMngDAO, ExecutionPlanMapper executionPlanMapper) {
        this.connectionMngDAO = connectionMngDAO;
        this.executionPlanMapper = executionPlanMapper;
    }

    @Override
    public ExecutionPlanMng initNew() {
        return initNew(MODE_SEQUENTIAL);
    }

    @Override
    public ExecutionPlanMng initNew(String mode) {
        ExecutionPlanMng executionPlan = new ExecutionPlanMng();
        executionPlan.setMode(mode);
        executionPlan.setSteps(new ArrayList<>());
        executionPlan.setOnError(initOnError());

        return executionPlan;
    }

    @Override
    public ExecutionPlanMng reorderSteps(Long connectionId, MapperMng mapper, boolean save) {
        // Fetch the connection with necessary details: execution plan, flowcharts, and mappers
        ConnectionMng connection = connectionMngDAO.getConnection(
                connectionId,
                ConnectionCriteria.builder()
                        .executionPlan(true)
                        .flowcharts(true)
                        .mappers(true)
                        .build()
        );

        // Ensure the mappers list is initialized to avoid NullPointerException
        if (connection.getMappers() == null) {
            connection.setMappers(new ArrayList<>());
        }

        // If the mapper is new (no ID), simply add it to the connection
        if (mapper.getId() == null) {
            connection.getMappers().add(mapper);
        } else {
            // Otherwise, try to find the existing mapper by ID
            int index = -1;
            for (int i = 0; i < connection.getMappers().size(); i++) {
                if (mapper.getId().equals(connection.getMappers().get(i).getId())) {
                    index = i;
                    break;
                }
            }

            if (index != -1) {
                // If found, replace the old mapper with the new one
                connection.getMappers().remove(index);
                connection.getMappers().add(mapper);
            } else {
                // If not found, throw an exception since we cannot reorder a non-existent mapper
                throw new GeneralServiceException(
                        ExceptionConstant.INVALID_DATA,
                        "Mapper not found: " + mapper.getId()
                );
            }
        }

        // Create a mapping from method IDs to flowchart IDs for building dependency edges
        Map<String, String> methodToFlowchart = methodToFlowchart(connection);

        // Convert mappers and methods into graph edges for topological sorting
        List<Edge<String, PairWeight<String, String>>> edges = MapperUtils.convertToEdges(
                connection.getMappers(),
                methodToFlowchart,
                connection.getExecutionPlan().getSteps()
        );

        // Sort steps topologically based on dependencies defined by edges
        List<String> steps = FlowchartHelperFactory.getInstance(connection.getExecutionPlan().getMode())
                .sortTopologically(connection.getExecutionPlan().getSteps(), edges);

        // Update the execution plan with the new sorted order
        connection.getExecutionPlan().setSteps(steps);

        // Persist changes if 'save' is true
        if (save) {
            connectionMngDAO.updateExecutionPlan(connection.getConnectionId(), connection.getExecutionPlan());
        }

        // Return the updated execution plan
        return connection.getExecutionPlan();
    }

    @Override
    public ExecutionPlanDTO getByConnectionId(Long connectionId) {
        ConnectionMng connection = connectionMngDAO.getConnection(connectionId, ConnectionCriteria.builder().executionPlan(true).build());
        
        return executionPlanMapper.toDTO(connection.getExecutionPlan());
    }


    private Map<String, String> methodToFlowchart(ConnectionMng connection) {
        HashMap<String, String> methodToFlowchartMap = new HashMap<>();
        for (FlowchartMng flowchart : connection.getFlowcharts()) {
            for (MethodMng method : flowchart.getMethods()) {
                methodToFlowchartMap.put(method.getColor(), flowchart.getFlowId());
            }
        }
        return methodToFlowchartMap;
    }

    private OnErrorMng initOnError() {
        OnErrorMng onErrorMng = new OnErrorMng();
        onErrorMng.setStrategy(STRATEGY_STOP);

        RetryOnErrorMng retry = new RetryOnErrorMng();
        retry.setBackoffMs(RETRY_BACKOFF_MS);
        retry.setMaxAttempts(RETRY_MAX_ATTEMPTS);

        onErrorMng.setRetry(retry);
        return onErrorMng;
    }
}
