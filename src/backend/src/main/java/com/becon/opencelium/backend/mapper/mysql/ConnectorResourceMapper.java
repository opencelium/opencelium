package com.becon.opencelium.backend.mapper.mysql;


import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.connector.ConnectorMetaDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.utility.StringUtility;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.Date;
import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                HelperMapper.class,
                RequestDataMapper.class
        },
        imports = {
                StringUtility.class
        }
)
@Named("connectorResourceMapper")
public interface ConnectorResourceMapper extends Mapper<Connector, ConnectorResource> {

    @Mappings({
            @Mapping(target = "connectorId", source = "id"),
            @Mapping(target = "icon", expression = "java(StringUtility.resolveImagePath(entity.getIcon()))"),
            @Mapping(target = "invoker", qualifiedByName = {"helperMapper", "getInvokerDTO"}),
            @Mapping(target = "requestData", qualifiedByName = {"requestDataMapper", "toDTO"}),
            @Mapping(target = "sslCert", source = "trustCertificate"),
            @Mapping(target = "status", source = "status"),
            @Mapping(target = "lastTestError", source = "lastTestError"),
            @Mapping(target = "lastCheckedAt", source = "lastCheckedAt", qualifiedByName = "dateToEpochMillis")
    })
    ConnectorResource toDTO(Connector entity);

    @Named("dateToEpochMillis")
    static Long dateToEpochMillis(Date date) {
        return date == null ? null : date.getTime();
    }

    /**
     * Maps to the lightweight health/status view. Touches no request data, so it is
     * safe on raw (still-encrypted) entities.
     */
    default ConnectorMetaDTO toMetaDTO(Connector entity) {
        if (entity == null) {
            return null;
        }
        ConnectorMetaDTO dto = new ConnectorMetaDTO();
        dto.setConnectorId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setIcon(StringUtility.resolveImagePath(entity.getIcon()));
        dto.setSslCert(entity.isTrustCertificate());
        dto.setTimeout(entity.getTimeout());
        dto.setInvoker(new ConnectorMetaDTO.InvokerMetaDTO(entity.getInvoker()));
        dto.setStatus(entity.getStatus());
        dto.setLastTestError(entity.getLastTestError());
        dto.setLastCheckedAt(dateToEpochMillis(entity.getLastCheckedAt()));
        return dto;
    }

    default List<ConnectorMetaDTO> toMetaDTOAll(List<Connector> entities) {
        return entities.stream().map(this::toMetaDTO).toList();
    }

    @Mappings({
            @Mapping(target = "id", source = "connectorId"),
            @Mapping(target = "invoker", source = "invoker.name"),
            @Mapping(target = "icon", expression = "java(StringUtility.findImageFromUrl(dto.getIcon()))"),
            @Mapping(target = "requestData", expression = "java(helperMapper.processRequestData(dto))"),
            @Mapping(target = "trustCertificate", source = "sslCert"),
            // Health fields are written only by the backend's own check flow, never from client input.
            @Mapping(target = "status", ignore = true),
            @Mapping(target = "lastCheckedAt", ignore = true)
    })
    Connector toEntity(ConnectorResource dto);
}
