package com.becon.opencelium.backend.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

public class JSTest {

    private final ScriptEngine nashornEngine = new NashornEngine();
    private final ScriptEngine graalJsEngine = new GraalJSEngine();
    private Map<String, Object> variableContext = initContext();

    private final Function<String, Object> refExtractor = variableContext::get;

    private Map<String, Object> initContext() {
        variableContext = new HashMap<>();

        variableContext.put("#B3CDE0.(response).body.$.result[]", List.of(Map.of("id", "12")));
        variableContext.put("#98BEC7.(response).body.$.name", "1");
        variableContext.put("#98BEC7.(response).body.$.properties.addressPrefix", "1/2");


        return variableContext;
    }

    @Test
    public void test1() {
        String script = "RESULT_VAR = '1';";

        Object nashornResult = nashornEngine.execute(script);

        Object graalJsResult = graalJsEngine.execute(script);

        Assertions.assertEquals(nashornResult, graalJsResult);
    }

    @Test
    public void test2() {
        String script = "RESULT_VAR = VAR_0[0].id;";

        Map<String, String> args = Map.of(
                "VAR_0", "#B3CDE0.(response).body.$.result[]"
        );

        Object nashornResult = nashornEngine.execute(script, args, refExtractor);

        Object graalJsResult = graalJsEngine.execute(script, args, refExtractor);

        Assertions.assertEquals(nashornResult, graalJsResult);
    }


    @Test
    public void test3() {
        String script = "RESULT_VAR = VAR_0;";

        Map<String, String> args = Map.of(
                "VAR_0", "#98BEC7.(response).body.$.name"
        );

        Object nashornResult = nashornEngine.execute(script, args, refExtractor);

        Object graalJsResult = graalJsEngine.execute(script, args, refExtractor);

        Assertions.assertEquals(nashornResult, graalJsResult);
    }


    @Test
    public void test4() {
        String script = """
                var result = 24;
                var split  = VAR_0.split("/");
                result = split[1];

                RESULT_VAR = result | 0;""";

        Map<String, String> args = Map.of(
                "VAR_0", "#98BEC7.(response).body.$.properties.addressPrefix"
        );

        Object nashornResult = nashornEngine.execute(script, args, refExtractor);

        Object graalJsResult = graalJsEngine.execute(script, args, refExtractor);

        System.out.println("nashorn - " + nashornResult);
        System.out.println("nashorn - " + graalJsResult);

        Assertions.assertEquals(nashornResult, graalJsResult);
    }


}
