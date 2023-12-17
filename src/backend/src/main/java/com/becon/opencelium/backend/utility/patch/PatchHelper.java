package com.becon.opencelium.backend.utility.patch;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.fge.jsonpatch.JsonPatch;
import com.github.fge.jsonpatch.JsonPatchException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.function.Function;

@Component
public class PatchHelper {

    private final ObjectMapper mapper;

    public PatchHelper(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * Performs a JSON Patch operation.
     *
     * @param patch      JSON Patch document
     * @param targetBean object that will be patched
     * @param beanClass  class of the object the will be patched
     * @param <T>
     * @return patched object
     */
    public <T> T patch(JsonPatch patch, T targetBean, Class<T> beanClass) {
        JsonNode jsonNode = applyPatch(patch, targetBean);
        try {
            return convert(jsonNode, beanClass);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }


    private <T> JsonNode applyPatch(JsonPatch patch, T target) {
        try {
            return patch.apply(mapper.valueToTree(target));
        } catch (JsonPatchException ignored) {
            return mapper.valueToTree(target);
        }
    }

    private <T> T convert(JsonNode jsonNode, Class<T> beanClass) throws JsonProcessingException {
        return mapper.treeToValue(jsonNode, beanClass);
    }

    public JsonPatch getJsonPatch(String op, String path, Object value) {
        if (value == null) {
            return getJsonPatch(op, path);
        }
        ObjectNode node = JsonNodeFactory.instance.objectNode();
        ArrayNode arrayNode = JsonNodeFactory.instance.arrayNode();
        node.put("op", op);
        node.put("path", path);
        node.set("value", mapper.valueToTree(value));
        arrayNode.add(node);
        try {
            return JsonPatch.fromJson(arrayNode);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public JsonPatch getJsonPatch(String op, String path) {
        ObjectNode node = JsonNodeFactory.instance.objectNode();
        ArrayNode arrayNode = JsonNodeFactory.instance.arrayNode();
        node.put("op", op);
        node.put("path", path);
        arrayNode.add(node);
        try {
            return JsonPatch.fromJson(arrayNode);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public JsonPatch changeEachPath(JsonPatch patch, Function<String, String> operation) {
        JsonNode jsonNode = mapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        List<JsonNode> nodeList = new ArrayList<>();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            next = ((ObjectNode) next).put("path", operation.apply(path));
            nodeList.add(next);
        }
        return mapper.convertValue(nodeList, JsonPatch.class);
    }

    public JsonPatch extract(JsonPatch patch, Function<String, Boolean> operation) {
        JsonNode jsonNode = mapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        List<JsonNode> nodeList = new ArrayList<>();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            if (operation.apply(path))
               nodeList.add(next);
        }
        return mapper.convertValue(nodeList, JsonPatch.class);
    }

    public boolean isEmpty(JsonPatch patch) {
        JsonNode jsonNode = mapper.convertValue(patch, JsonNode.class);
        return jsonNode.isEmpty();
    }
}
