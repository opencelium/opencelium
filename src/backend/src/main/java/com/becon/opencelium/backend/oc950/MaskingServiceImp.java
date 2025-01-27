package com.becon.opencelium.backend.oc950;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.enums.MaskPart;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

public class MaskingServiceImp implements MaskingService {
    private final List<MaskingRule> rules;

    public MaskingServiceImp(List<MaskingRule> rules) {
        this.rules = rules;
    }

    @Override
    public String applyMask(Object message, MaskPart part) {
        return null;
    }


    private String convertToStringIfNecessary(Object body) {
        if (body == null) {
            return "";
        } else if (body instanceof String result) {
            return result;
        }

        try {
            return new ObjectMapper().writer().withDefaultPrettyPrinter().writeValueAsString(body);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
