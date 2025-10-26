package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import org.springframework.stereotype.Component;

@Component
public class ConnectionExMapper {
    private final FlowchartMapperEx flowchartMapperEx;
    private final FieldBindExMapper fieldBindExMapper;
    private final ExecutionPlanExMapper executionPlanExMapper;

    public ConnectionExMapper(FlowchartMapperEx flowchartMapperEx, FieldBindExMapper fieldBindExMapper, ExecutionPlanExMapper executionPlanExMapper) {
        this.flowchartMapperEx = flowchartMapperEx;
        this.fieldBindExMapper = fieldBindExMapper;
        this.executionPlanExMapper = executionPlanExMapper;
    }

    public ConnectionEx toEntity(ConnectionMng dto){
        ConnectionEx connectionEx = new ConnectionEx();
        connectionEx.setConnectionId(dto.getConnectionId());
        connectionEx.setFlowcharts(flowchartMapperEx.toFlowchartExAll(dto.getFlowcharts(), dto.getConnectionId()));
        connectionEx.setExecutionPlan(executionPlanExMapper.toExecutionPlanEx(dto.getExecutionPlan()));
        connectionEx.setFieldBind(fieldBindExMapper.toEntityAll(dto.getFieldBindings()));
        return connectionEx;
    }
}
