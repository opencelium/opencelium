package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.FlowchartMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.mapper.mongo.OperatorMngMapper;
import com.becon.opencelium.backend.mapper.mysql.invoker.InvokerMapper;
import com.becon.opencelium.backend.resource.v5.connection.FlowchartDTO;
import com.becon.opencelium.backend.utility.StringUtility;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

@Named("flowchartMapper")
@Mapper(
        componentModel = "spring",
        imports = {
                StringUtility.class,
        }
)
public abstract class FlowchartMapper {

    @Autowired
    protected InvokerService invokerService;

    @Autowired
    protected MethodMngMapper methodMngMapper;

    @Autowired
    protected OperatorMngMapper operatorMngMapper;

    @Autowired
    protected InvokerMapper invokerMapper;

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "methods", expression = "java(methodMngMapper.toDTOAll(flowchart.getMethods()))"),
            @Mapping(target = "operators", expression = "java(operatorMngMapper.toDTOAll(flowchart.getOperators()))"),
            @Mapping(target = "icon", expression = "java(connector != null ? StringUtility.resolveImagePath(connector.getIcon()) : null)"),
            @Mapping(target = "invoker", expression = "java(invokerMapper.toDTO(invokerService.findByName(connector.getInvoker())))"),
            @Mapping(target = "sslCert", expression = "java(connector != null && connector.isSslValidation())"),
            @Mapping(target = "timeout", expression = "java(connector != null ? connector.getTimeout() : null)")
    })
    public abstract FlowchartDTO toDTO(FlowchartMng flowchart, @Context Connector connector);

    public abstract FlowchartMng fromConnector(ConnectorMng connector);
}
