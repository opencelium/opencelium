package com.becon.opencelium.backend.utility.patch;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.JsonPatch;
import com.github.fge.jsonpatch.diff.JsonDiff;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Component
public class ConnectionPatchUtils {
    private final ObjectMapper mapper;

    public ConnectionPatchUtils(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public JsonPatch createReverseDiff(Connection after, Connection before, ConnectionMng afterMng, ConnectionMng beforeMng) {
        after.getEnhancements().forEach(e->e.setConnection(null));
        before.getEnhancements().forEach(e->e.setConnection(null));
        JsonPatch diff = JsonDiff.asJsonPatch(mapper.valueToTree(before), mapper.valueToTree(after));
        JsonPatch diffMng = JsonDiff.asJsonPatch(mapper.valueToTree(beforeMng), mapper.valueToTree(afterMng));
        return merge(diff, diffMng);
    }

    private JsonPatch merge(JsonPatch patch, JsonPatch patchMng) {
        List<JsonNode> mergedNodes = new ArrayList<>();
        JsonNode patchNode = mapper.convertValue(patch, JsonNode.class);
        JsonNode patchMngNode = mapper.convertValue(patchMng, JsonNode.class);
        Iterator<JsonNode> patchNodes = patchNode.elements();
        while (patchNodes.hasNext()) {
            JsonNode next = patchNodes.next();
            String path = next.get("path").textValue();
            if (!path.equals("/modifiedOn") && (path.equals("/title") || path.equals("/description") || path.equals("/icon") || path.equals("/fromConnector") || path.equals("/toConnector"))) {
                mergedNodes.add(next);
            }
        }

        Iterator<JsonNode> patchMngNodes = patchMngNode.elements();
        while (patchMngNodes.hasNext()) {
            JsonNode next = patchMngNodes.next();
            String path = next.get("path").textValue();
            if (!(path.equals("/fromConnector") || path.equals("/toConnector"))) {
                JsonNode nodeDuplicate = mergedNodes.stream().filter(n -> n.get("path").textValue().equals(path)).findAny().orElse(null);
                if (nodeDuplicate == null) {
                    mergedNodes.add(next);
                }
            }
        }

        return mapper.convertValue(mergedNodes, JsonPatch.class);
    }

}
