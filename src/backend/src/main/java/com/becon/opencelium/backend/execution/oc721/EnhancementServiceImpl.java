package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.execution.ExecutionManager;
import com.fasterxml.jackson.core.type.TypeReference;
import org.openjdk.nashorn.api.scripting.JSObject;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.openjdk.nashorn.api.scripting.ScriptObjectMirror;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class EnhancementServiceImpl implements EnhancementService {
    private final ExecutionManager executionManager;

    public EnhancementServiceImpl(ExecutionManager executionManager) {
        this.executionManager = executionManager;
    }

    @Override
    public Object execute(Enhancement enhancement) {
        ScriptEngineManager manager = new ScriptEngineManager();
        ScriptEngine engine = manager.getEngineByName("nashorn");

        // resolve and store all referenced values
        ObjectMapper mapper = new ObjectMapper();
        Map<String, String> varNameValuePairs = new HashMap<>();
        enhancement.getArgs().forEach((varName, ref) -> {
            try {
                // get the actual result
                Object value = executionManager.getValue(ref);

                // convert to string if it is not already a string
                String stringValue = value instanceof String ? value.toString() : mapper.writeValueAsString(value);

                // replace | remove 'xml' related attributes
                stringValue = stringValue.replace("__oc__attributes.", "@").replace(".__oc__value", "");

                // store resolved result
                varNameValuePairs.put(varName, stringValue);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        });

        // add all variables to engine in correct format
        varNameValuePairs.forEach((varName, stringValue) -> {
            if (isJSON(stringValue)) {
                engine.put("dataModel", stringValue);
                JSObject obj = (JSObject) evaluate(engine, "JSON.parse(dataModel)");

                engine.put(varName, obj);
            } else {
                engine.put(varName, stringValue);
            }
        });

        Object result = evaluate(engine, enhancement.getScript());

        // if 'result' is a primitive (Number, String, Boolean) type then just return
        boolean isPrimitive = result instanceof Number || result instanceof String || result instanceof Boolean;
        if (result == null || isPrimitive) {
            return result;
        }

        // check if 'result' is an instance of 'Array'
        boolean isArray = ((ScriptObjectMirror) result).isArray();

        try {
            ScriptObjectMirror JSON = (ScriptObjectMirror) engine.eval("JSON");
            String stringifiedResult = JSON.callMember("stringify", result).toString();

            if (isArray) {
                String arrayRegex = "\\[(.*?)\\]";
                final Pattern pattern = Pattern.compile(arrayRegex, Pattern.MULTILINE);
                final Matcher matcher = pattern.matcher(stringifiedResult);
                if (!matcher.matches()) {
                    throw new RuntimeException("Expected an array while running enhancement.");
                }

                return (List) mapper.readValue(stringifiedResult, Object.class);
            } else {
                return mapper.readValue(stringifiedResult, new TypeReference<Map<String, Object>>(){});
            }
        } catch (ScriptException | IOException e){
            throw new RuntimeException(e);
        }
    }

    private static Object evaluate(ScriptEngine engine, String code) {
        try {
            return engine.eval(code);
        } catch (ScriptException e) {
            throw new RuntimeException(e);
        }
    }

    private static boolean isJSON(String value) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(DeserializationFeature.FAIL_ON_READING_DUP_TREE_KEY);

            JsonFactory factory = mapper.getFactory();
            JsonParser parser = factory.createParser(value);

            JsonNode jsonObj = mapper.readTree(parser);
            if (jsonObj instanceof ObjectNode || jsonObj instanceof ArrayNode) {
                return true;
            }
        } catch (IOException ignored) {
        }

        return false;
    }
}
