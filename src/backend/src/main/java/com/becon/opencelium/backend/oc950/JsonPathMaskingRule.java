package com.becon.opencelium.backend.oc950;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.jayway.jsonpath.Configuration;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.Option;
import com.jayway.jsonpath.PathNotFoundException;

import java.util.List;

public class JsonPathMaskingRule implements MaskingRuleApplier {
    @Override
    public String apply(String json, MaskingRule rule) {
        String directRef = rule.getExpression();
        String jsonPath = directRef.substring(directRef.indexOf('$'));

        try {
            Configuration conf = Configuration.builder()
                    .options(Option.ALWAYS_RETURN_LIST, Option.SUPPRESS_EXCEPTIONS)
                    .build();
            DocumentContext jsonContext = JsonPath.using(conf).parse(json);

            if (!jsonContext.read(jsonPath, List.class).isEmpty()) {
                jsonContext.set(jsonPath, rule.getMask());
            }

            return jsonContext.jsonString();
        } catch (PathNotFoundException e) {
            return json;
        }
    }
}
