package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

@Mapper(
        componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {MethodMapper.class, OperatorMapper.class}
)
@Named("connectorMapper")
public abstract class ConnectorMapper {
    @Autowired
    @Qualifier("connectorServiceImp")
    private ConnectorService connectorService;
    @Autowired
    @Qualifier("invokerServiceImp")
    private InvokerService invokerService;
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "nodeId"),
            @Mapping(target = "methods", qualifiedByName = {"methodMapper","toEntityAll"}),
            @Mapping(target = "operators", qualifiedByName = {"operatorMapper","toEntityAll"})
    })
    public abstract ConnectorMng toEntity(ConnectorDTO connectorDTO);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "nodeId", source = "id"),
            @Mapping(target = "methods", qualifiedByName = {"methodMapper","toDTOAll"}),
            @Mapping(target = "operators", qualifiedByName = {"operatorMapper","toDTOAll"})
    })
    public abstract ConnectorDTO toDTO(ConnectorMng connectorMng);

    @Mappings({
            @Mapping(target = "connectorId", source = "id"),
            @Mapping(target = "id", ignore = true),
            @Mapping(target = "methods", ignore = true),
            @Mapping(target = "operators", ignore = true)
    })
    public abstract ConnectorMng toDTO(Connector connector);

    @BeforeMapping
    protected void beforeToDTO(@MappingTarget ConnectorDTO connectorDTO, ConnectorMng connectorMng){
        Integer connectorId = connectorMng.getConnectorId();
        Connector connector = connectorService.getById(connectorId);
        connectorDTO.setSslCert(connector.isSslCert());
        connectorDTO.setTimeout(connector.getTimeout());
        connectorDTO.setIcon(connector.getIcon());
        connectorDTO.setInvoker(invokerService.toResource(invokerService.findByName(connector.getInvoker())));
    }
}
