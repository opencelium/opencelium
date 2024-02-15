package com.becon.opencelium.backend.utility.patch;

import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.fge.jsonpatch.JsonPatch;
import com.github.fge.jsonpatch.JsonPatchException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
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
        } catch (JsonPatchException e) {
            throw new RuntimeException(e);
        }
    }

    private <T> T convert(JsonNode jsonNode, Class<T> beanClass) throws JsonProcessingException {
        return mapper.treeToValue(jsonNode, beanClass);
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

    public boolean isEmpty(JsonPatch patch) {
        JsonNode jsonNode = mapper.convertValue(patch, JsonNode.class);
        return jsonNode.isEmpty();
    }

    public PatchConnectionDetails describe(JsonPatch patch) {
        JsonNode jsonNode = mapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        PatchConnectionDetails details = new PatchConnectionDetails();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            String op = next.get("op").textValue();
            PatchConnectionDetails.PatchOperationDetail opDetail = new PatchConnectionDetails.PatchOperationDetail();

            if (path.matches("/fromConnector/methods/-")
                    || path.matches("/fromConnector/methods/\\d+")
                    || path.matches("/toConnector/methods/-")
                    || path.matches("/toConnector/methods/\\d+")) {
                switch (op) {
                    case "add" -> opDetail.setMethodAdded(true);
                    case "replace" -> opDetail.setMethodReplaced(true);
                    case "remove" -> opDetail.setMethodDeleted(true);
                }
                opDetail.setIndexOfMethod(getIndexOfList(path));
            } else if (path.matches("/fromConnector/methods/-/.+")
                    || path.matches("/fromConnector/methods/\\d+/.+")
                    || path.matches("/toConnector/methods/-/.+")
                    || path.matches("/toConnector/methods/\\d+/.+")) {
                opDetail.setMethodModified(true);
                opDetail.setIndexOfMethod(getIndexOfList(path, 3));
            } else if (path.equals("/fromConnector/methods") || path.equals("/toConnector/methods")) {
                opDetail.setReplacedMethodList(true);
            } else if (path.matches("/fromConnector/operators/-")
                    || path.matches("/fromConnector/operators/\\d+")
                    || path.matches("/toConnector/operators/-")
                    || path.matches("/toConnector/operators/\\d+")) {
                switch (op) {
                    case "add" -> opDetail.setOperatorAdded(true);
                    case "replace" -> opDetail.setOperatorReplaced(true);
                    case "remove" -> opDetail.setOperatorDeleted(true);
                }
                opDetail.setIndexOfOperator(getIndexOfList(path));
            } else if (path.matches("/fromConnector/operators/-/.+")
                    || path.matches("/fromConnector/operators/\\d+/.+")
                    || path.matches("/toConnector/operators/-/.+")
                    || path.matches("/toConnector/operators/\\d+/.+")) {
                opDetail.setOperatorModified(true);
                opDetail.setIndexOfOperator(getIndexOfList(path, 3));
            } else if (path.equals("/fromConnector/operators") || path.equals("/toConnector/operators")) {
                opDetail.setReplacedOperatorList(true);
            } else if (path.matches("/fieldBinding/-") || path.matches("/fieldBinding/\\d+")) {
                switch (op) {
                    case "add" -> opDetail.setEnhancementAdded(true);
                    case "replace" -> opDetail.setEnhancementReplaced(true);
                    case "remove" -> opDetail.setEnhancementDeleted(true);
                }
                opDetail.setIndexOfEnhancement(getIndexOfList(path));
            } else if (path.matches("/fieldBinding/-/.+") || path.matches("/fieldBinding/\\d+/.+")) {
                opDetail.setEnhancementModified(true);
                opDetail.setIndexOfEnhancement(getIndexOfList(path, 2));
            } else if (path.equals("/fieldBinding")) {
                opDetail.setReplacedEnhancementList(true);
            }
            details.getOpDetails().add(opDetail);

            if (path.startsWith("/fromConnector")) {
                opDetail.setFrom(true);
            } else if (path.startsWith("/toConnector")) {
                opDetail.setFrom(false);
            }

            if (path.equals("/fromConnector")
                    || path.equals("/toConnector")
                    || path.equals("/fromConnector/methods")
                    || path.equals("/toConnector/methods")) {
                opDetail.setReplacedMethodList(true);
            }


            if (path.equals("/fromConnector")
                    || path.equals("/toConnector")
                    || path.equals("/fromConnector/operators")
                    || path.equals("/toConnector/operators")) {
                opDetail.setReplacedOperatorList(true);
            }
        }
        return details;
    }

    public int getIndexOfList(String path) {
        if (path.matches(".+/-")) {
            return -1;
        }
        if (path.matches(".+/\\d+")) {
            String[] split = path.split("/");
            return Integer.parseInt(split[split.length - 1]);
        }
        throw new RuntimeException("PATH_IS_INVALID");
    }

    public int getIndexOfList(String path, int order) {
        String[] split = path.split("/");
        return getIndexOfList(String.join("/", Arrays.stream(split).limit(order + 1).toList()));
    }

    public int getIndexOfList(int idx, int size) {
        return idx == -1 ? size - 1 : idx;
    }
}
