package com.becon.opencelium.backend.mapper.utils;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.mongo.InvokerMngMapper;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.mapper.mongo.OperatorMngMapper;
import com.becon.opencelium.backend.mapper.mysql.ConnectorMapper;
import com.becon.opencelium.backend.mapper.mysql.InvokerMapper;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;

@Mapper(
        componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {
                OperatorMngMapper.class,
                MethodMngMapper.class
        }
)
@Named("helperMapper")
public abstract class HelperMapper {
    @Autowired @Lazy
    @Qualifier("connectorServiceImp")
    private ConnectorService connectorService;
    @Autowired
    @Qualifier("invokerServiceImp")
    private InvokerService invokerService;
    @Autowired
    private InvokerMapper invokerMapper;
    @Autowired @Lazy
    private ConnectorMapper connectorMapper;


    @Named("toConnectorDTO")
    public ConnectorDTO toConnectorDTO(ConnectorMng connectorMng){
        ConnectorDTO connectorDTO = toDTO(connectorMng);
        Connector connector = connectorService.getById(connectorDTO.getConnectorId());
        connectorDTO.setIcon(connector.getIcon());
        connectorDTO.setTimeout(connector.getTimeout());
        connectorDTO.setSslCert(connector.isSslCert());
        connectorDTO.setInvoker(getInvokerDTO(connector.getInvoker()));
        return connectorDTO;
    }
    @Named("getConnectorDTOById")
    public ConnectorDTO getConnectorDTOById(int id){
        return connectorMapper.toDTO(connectorService.getById(id));
    }
    @Mappings({
            @Mapping(target = "nodeId", source = "id"),
            @Mapping(target = "methods", qualifiedByName = {"methodMngMapper","toDTOAll"}),
            @Mapping(target = "operators", qualifiedByName = {"operatorMngMapper","toDTOAll"})
    })
    protected abstract ConnectorDTO toDTO(ConnectorMng connectorMng);

    @Named("getInvokerDTO")
    public InvokerDTO getInvokerDTO(String invoker){
        return invokerMapper.toDTO(invokerService.findByName(invoker));
    }
}
