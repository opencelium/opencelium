package com.becon.opencelium.backend.mapper.utils;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.mongo.FieldBindingMngMapper;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.mapper.mongo.OperatorMngMapper;
import com.becon.opencelium.backend.mapper.mysql.ConnectorMapper;
import com.becon.opencelium.backend.mapper.mysql.EnhancementMapper;
import com.becon.opencelium.backend.mapper.mysql.InvokerMapper;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;

import java.util.ArrayList;
import java.util.List;

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
    @Qualifier("fieldBindingMngServiceImp")
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
            connectorDTO.setSslCert(connector.isSslCert());
            connectorDTO.setInvoker(getInvokerDTO(connector.getInvoker()));
        }
        return connectorDTO;
    }

    @Named("getConnectorDTOById")
    public ConnectorDTO getConnectorDTOById(int id) {
        return connectorMapper.toDTO(connectorService.findById(id).orElse(null));
    }

    @Named("getFieldBindings")
    public List<FieldBindingDTO> getFieldBindings(List<Enhancement> enhancements){
        List<FieldBindingDTO> list = new ArrayList<>(enhancements.size());
        ArrayList<Integer> ids = new ArrayList<>();
        for (Enhancement enhancement : enhancements) {
            if(enhancement.getId()!=null){
                ids.add(enhancement.getId());
            }else {
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
}
