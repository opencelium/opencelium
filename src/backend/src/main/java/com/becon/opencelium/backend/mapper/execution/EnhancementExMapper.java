package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.execution.EnhancementEx;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("enhancementExMapper")
public interface EnhancementExMapper extends Mapper<EnhancementEx, EnhancementMng> {
    @Named("toEntity")
    default EnhancementEx toEntity(EnhancementMng dto) {
        EnhancementEx enhancement = new EnhancementEx();
        enhancement.setScript(dto.getScript());
        enhancement.setLang(dto.getLanguage());
        String variables = dto.getVariables().replaceAll("[/|\\\\n]","");
        String[] vars = variables.substring(0, variables.length()-1).split(";");

        Map<String, String> args = new HashMap<>();
        Arrays.stream(vars).forEach(v -> {
            String[] split = v.split("=");
            String key = split[0].trim().split("\\s")[1];
            String value = split[1].trim();
            args.put(key, value);
        });
        enhancement.setArgs(args);
        return enhancement;
    }

    default EnhancementMng toDTO(EnhancementEx entity){
        return null;
    }
}
