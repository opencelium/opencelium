package com.becon.opencelium.backend.utility.patch;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import com.github.fge.jsonpatch.JsonPatch;
import com.github.fge.jsonpatch.JsonPatchException;
import org.springframework.stereotype.Component;

import java.util.Collection;

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
        } catch (JsonProcessingException e){
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

    public <T extends Collection<?>> Integer parseToIndex(String index, T list) {
        return (index.equals("-")) ? list.size() - 1 : Integer.parseInt(index);
    }
}
