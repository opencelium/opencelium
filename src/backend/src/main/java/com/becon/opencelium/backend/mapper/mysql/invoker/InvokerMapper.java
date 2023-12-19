package com.becon.opencelium.backend.mapper.mysql.invoker;

import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import com.becon.opencelium.backend.utility.StringUtility;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                RequiredDataMapper.class,
                FunctionInvMapper.class
        },
        imports = {
                StringUtility.class
        }
)
@Named("invokerMapper")
public interface InvokerMapper extends Mapper<Invoker, InvokerDTO> {

    default Invoker toEntity(InvokerDTO dto){
        return null;
    }

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "icon", expression = "java(StringUtility.resolveImagePath(entity.getIcon()))"),
            @Mapping(target = "operations", qualifiedByName = {"functionInvMapper", "toDTOAll"}),
            @Mapping(target = "requiredData", qualifiedByName = {"requiredDataMapper", "toDTO"})
    })
    InvokerDTO toDTO(Invoker entity);
}
