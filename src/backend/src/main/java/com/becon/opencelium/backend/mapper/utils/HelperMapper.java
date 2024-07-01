package com.becon.opencelium.backend.mapper.utils;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.service.*;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.mongo.FieldBindingMngMapper;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.mapper.mongo.OperatorMngMapper;
import com.becon.opencelium.backend.mapper.mysql.ConnectorMapper;
import com.becon.opencelium.backend.mapper.mysql.ConnectorResourceMapper;
import com.becon.opencelium.backend.mapper.mysql.EnhancementMapper;
import com.becon.opencelium.backend.mapper.mysql.RequestDataMapper;
import com.becon.opencelium.backend.mapper.mysql.invoker.InvokerMapper;
import com.becon.opencelium.backend.resource.CategoryResponseDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
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
    @Qualifier("enhancementServiceImp")
    private EnhancementService enhancementService;

    @Autowired
    @Qualifier("invokerServiceImp")
    private InvokerService invokerService;

    @Autowired
    @Qualifier("requestDataServiceImp")
    private RequestDataService requestDataService;

    @Autowired
    @Qualifier("fieldBindingMngServiceImp")
    @Lazy
    private FieldBindingMngService fieldBindingMngService;

    @Autowired
    private InvokerMapper invokerMapper;

    @Autowired
    @Lazy
    private ConnectorMapper connectorMapper;

    @Autowired
    @Lazy
    private EnhancementMapper enhancementMapper;

    @Autowired
    @Lazy
    private FieldBindingMngMapper fieldBindingMngMapper;

    @Autowired
    @Lazy
    private RequestDataMapper requestDataMapper;

    @Autowired
    @Lazy
    private ConnectorResourceMapper connectorResourceMapper;

    @Autowired
    @Qualifier("categoryServiceImp")
    @Lazy
    private CategoryService categoryService;


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
        return connectorMapper.toDTO(connectorService.findById(id).orElse(null));
    }

    @Named("getConnectorResourceById")
    public ConnectorResource getConnectorResourceById(int id) {
        return connectorResourceMapper.toDTO(connectorService.findById(id).orElse(null));
    }

    @Named("getFieldBindings")
    public List<FieldBindingDTO> getFieldBindings(List<Enhancement> enhancements) {
        if(enhancements == null){
            return Collections.emptyList();
        }
        List<FieldBindingDTO> list = new ArrayList<>(enhancements.size());
        ArrayList<Integer> ids = new ArrayList<>();
        for (Enhancement enhancement : enhancements) {
            if (enhancement.getId() != null) {
                ids.add(enhancement.getId());
            } else {
                FieldBindingDTO fieldBindingDTO = new FieldBindingDTO();
                fieldBindingDTO.setEnhancement(enhancementMapper.toDTO(enhancement));
                list.add(fieldBindingDTO);
            }
        }
        list.addAll(fieldBindingMngMapper.toDTOAll(fieldBindingMngService.findAllByEnhancementId(ids)));
        return list;
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
            return new ArrayList<>();
        requestData.forEach(r -> {
            RequestData data = requestDataService.findByConnectorIdAndField(dto.getConnectorId(), r.getField()).orElse(null);
            if (data != null) {
                r.setId(data.getId());
            }
            Connector connector = new Connector();
            connector.setId(dto.getConnectorId());
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

    @Named("getEnhancementDTOById")
    public EnhancementDTO getEnhancementDTOById(Integer id) {
        Enhancement enhancement = enhancementService.getById(id);
        return enhancementMapper.toDTO(enhancement);
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
