package com.becon.opencelium.backend.mapper.utils;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.service.*;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.mapper.mongo.OperatorMngMapper;
import com.becon.opencelium.backend.mapper.mysql.ConnectorMapper;
import com.becon.opencelium.backend.mapper.mysql.ConnectorResourceMapper;
import com.becon.opencelium.backend.mapper.mysql.RequestDataMapper;
import com.becon.opencelium.backend.mapper.mysql.invoker.InvokerMapper;
import com.becon.opencelium.backend.resource.CategoryResponseDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;

import java.util.*;
import java.util.stream.Collectors;

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
    @Autowired
    @Lazy
    @Qualifier("connectorServiceImp")
    private ConnectorService connectorService;

    @Autowired
    @Qualifier("invokerServiceImp")
    private InvokerService invokerService;

    @Autowired
    @Qualifier("requestDataServiceImp")
    private RequestDataService requestDataService;

    @Autowired
    private InvokerMapper invokerMapper;

    @Autowired
    @Lazy
    private ConnectorMapper connectorMapper;

    @Autowired
    @Lazy
    private RequestDataMapper requestDataMapper;

    @Autowired
    @Lazy
    private ConnectorResourceMapper connectorResourceMapper;


    @Named("toConnectorDTO")
    public ConnectorDTO toConnectorDTO(ConnectorMng connectorMng) {
        ConnectorDTO connectorDTO = toDTO(connectorMng);
        if (connectorDTO == null) {
            return null;
        }
        Connector connector = connectorService.findById(connectorDTO.getConnectorId()).orElse(null);
        if (connector != null) {
            connectorDTO.setIcon(connector.getIcon());
            connectorDTO.setTimeout(connector.getTimeout());
            connectorDTO.setSslCert(connector.isSslValidation());
            connectorDTO.setInvoker(getInvokerDTO(connector.getInvoker()));
        }
        return connectorDTO;
    }

    @Named("getConnectorDTOById")
    public ConnectorDTO getConnectorDTOById(int id) {
        if (ConnectionConstants.DEFAULT_CONNECTOR_ID.equals(id)) {
            ConnectorDTO connectorDTO = new ConnectorDTO();
            connectorDTO.setConnectorId(ConnectionConstants.DEFAULT_CONNECTOR_ID);
            connectorDTO.setTitle(ConnectionConstants.DEFAULT_CONNECTOR_NAME);

            InvokerDTO invokerDTO = new InvokerDTO();
            invokerDTO.setName(ConnectionConstants.DEFAULT_INVOKER_NAME);
            connectorDTO.setInvoker(invokerDTO);
            return connectorDTO;
        }
        return connectorMapper.toDTO(connectorService.findById(id).orElse(null));
    }

    @Named("getConnectorResourceById")
    public ConnectorResource getConnectorResourceById(int id) {
        if (ConnectionConstants.DEFAULT_CONNECTOR_ID.equals(id)) {
            ConnectorResource connector = new ConnectorResource();
            connector.setConnectorId(ConnectionConstants.DEFAULT_CONNECTOR_ID);
            connector.setTitle(ConnectionConstants.DEFAULT_CONNECTOR_NAME);

            InvokerDTO invokerDTO = new InvokerDTO();
            invokerDTO.setName(ConnectionConstants.DEFAULT_INVOKER_NAME);
            connector.setInvoker(invokerDTO);
            return connector;
        }
        return connectorResourceMapper.toDTO(connectorService.findById(id).orElse(null));
    }

    @Mappings({
            @Mapping(target = "methods", qualifiedByName = {"methodMngMapper", "toDTOAll"}),
            @Mapping(target = "operators", qualifiedByName = {"operatorMngMapper", "toDTOAll"})
    })
    protected abstract ConnectorDTO toDTO(ConnectorMng connectorMng);

    @Named("getInvokerDTO")
    public InvokerDTO getInvokerDTO(String invoker) {
        try {
            return invokerMapper.toDTO(invokerService.findByName(invoker));
        } catch (Exception e) {
            return new InvokerDTO();
        }
    }

    @Named("processRequestData")
    public List<RequestData> processRequestData(ConnectorResource dto) {
        List<RequestData> requestData = requestDataMapper.toEntity(dto.getRequestData());
        if (requestData == null)
            return Collections.emptyList();

        Connector connector = new Connector();
        connector.setId(dto.getConnectorId());

        requestData.forEach(r -> {
            requestDataService.findByConnectorIdAndField(dto.getConnectorId(), r.getField()).ifPresent(data -> r.setId(data.getId()));
            r.setConnector(connector);
        });

        List<RequiredData> requiredData = invokerService.findByName(dto.getInvoker().getName()).getRequiredData();

        requestData.forEach(data -> {
            String visibility = requiredData.stream()
                    .filter(d -> d.getName().equals(data.getField()))
                    .map(RequiredData::getVisibility)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Visibility not found while converting to entity for field:" + data.getField()));

            data.setVisibility(visibility);
        });
        return requestData;
    }

    @Named("mapCategoriesToIds")
    public Set<Integer> mapCategoriesToIds(Set<Category> categories) {
        if (categories == null) {
            return null;
        }
        return categories.stream().map(Category::getId).collect(Collectors.toSet());
    }

    @Named("mapParentCategory")
    public CategoryResponseDTO mapParentCategory(Category parent) {
        if (parent == null) {
            return null;
        }
        CategoryResponseDTO category = new CategoryResponseDTO();
        category.setId(parent.getId());
        category.setName(parent.getName());
        return category;
    }

}
