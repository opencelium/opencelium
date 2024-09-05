package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.resource.execution.EnhancementEx;
import com.becon.opencelium.backend.resource.execution.FieldBindEx;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class FieldBindExMapper {
    private final EnhancementService enhancementService;

    public FieldBindExMapper(@Qualifier("enhancementServiceImp") EnhancementService enhancementService) {
        this.enhancementService = enhancementService;
    }


    public FieldBindEx toEntity(FieldBindingMng dto) {
        FieldBindEx fieldBindEx = new FieldBindEx();
        fieldBindEx.setBindId(dto.getId());

        Enhancement enhancement = enhancementService.getById(dto.getEnhancementId());
        EnhancementEx enhancementEx = new EnhancementEx();

        enhancementEx.setEnhanceId(dto.getEnhancementId());
        enhancementEx.setLang(enhancement.getLanguage());

        if (enhancement.getArgs() == null) {
            enhancementEx.setArgs(new HashMap<>());
        } else {
            String variables = enhancement.getArgs().replaceAll("\n", "");
            String[] vars = variables.substring(0, variables.length() - 1).split(";");
            for (int i = 0; i < vars.length; i++) {
                vars[i] = vars[i].substring(2);
            }

            Map<String, String> args = new HashMap<>();
            Arrays.stream(vars).forEach(v -> {
                String[] split = v.split("=");
                String key = split[0].trim().split("\\s")[1];
                String value = split[1].trim();
                if (!key.equals("RESULT_VAR")) {
                    args.put(key, value);
                }
            });

            String script = "(function() {\n" +
                    enhancement.getScript() +
                    "\nreturn RESULT_VAR;\n})()";

            enhancementEx.setScript(script);
            enhancementEx.setArgs(args);
        }

        fieldBindEx.setEnhance(enhancementEx);
        return fieldBindEx;
    }

    public List<FieldBindEx> toEntityAll(List<FieldBindingMng> dtoList) {
        if (dtoList == null || dtoList.isEmpty()) {
            return Collections.emptyList();
        }
        List<FieldBindEx> fieldBindExes = new ArrayList<>();
        for (FieldBindingMng fieldBindMng : dtoList) {
            fieldBindExes.add(toEntity(fieldBindMng));
        }
        return fieldBindExes;
    }
}
