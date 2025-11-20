package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.FlowchartMng;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.mapper.mongo.OperatorMngMapper;
import com.becon.opencelium.backend.resource.connection.v5.FlowchartDTO;
import com.becon.opencelium.backend.utility.StringUtility;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;

import java.util.List;

@Named("flowchartMapper")
@Mapper(
        componentModel = "spring",
        uses = {
                MethodMngMapper.class,
                OperatorMngMapper.class,
        },
        imports = {
                StringUtility.class,
        }
)
public interface FlowchartMapper {

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "methods", source = "methods", qualifiedByName = {"methodMngMapper", "toDTOAll"}),
            @Mapping(target = "operators", source = "operators", qualifiedByName = {"operatorMngMapper", "toDTOAll"})
    })
    FlowchartDTO toDTO(FlowchartMng flowchart);

    @Named("toDTOAll")
    default List<FlowchartDTO> toDTOAll(List<FlowchartMng> flowcharts) {
        if (flowcharts == null) {
            return null;
        }

        return flowcharts.stream().map(this::toDTO).toList();
    }
}
