package com.becon.opencelium.backend.rbmq_execution.mediator;

import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;

import java.util.List;
import java.util.Map;

public class InitialData {
    private final ConnectionNode connectionNode; // stores method, operator and field nodes
    private final List<EnhancementNode> enhancementNodes; // stores link between fields
    private final List<Enhancement> enhancements; // stores programming language code for managing data in enhancement
    private final Map<Integer, List<RequestData>> requestDataMap; // contains request data of connectors

    private InitialData(ConnectionNode connectionNode, List<EnhancementNode> enhancementNodes,
                          List<Enhancement> enhancements, Map<Integer, List<RequestData>> requestDataMap) {
        this.connectionNode = connectionNode;
        this.enhancementNodes = enhancementNodes;
        this.enhancements = enhancements;
        this.requestDataMap = requestDataMap;
    }

    public ConnectionNode getConnectionNode() {
        return connectionNode;
    }

    public List<EnhancementNode> getEnhancementNodes() {
        return enhancementNodes;
    }

    public List<Enhancement> getEnhancements() {
        return enhancements;
    }

    public Map<Integer, List<RequestData>> getRequestDataMap() {
        return requestDataMap;
    }

    // ----------------------------------- Builder ---------------------------------------------------- //
    public static class Builder {
        private ConnectionNode connectionNode;
        private List<EnhancementNode> enhancementNodes;
        private List<Enhancement> enhancements;
        private Map<Integer, List<RequestData>> requestDataMap;

        public InitialData.Builder setConnectionNode(ConnectionNode connectionNode) {
            this.connectionNode = connectionNode;
            return this;
        }

        public InitialData.Builder setEnhancementNodes(List<EnhancementNode> enhancementNodes) {
            this.enhancementNodes = enhancementNodes;
            return this;
        }

        public InitialData.Builder setEnhancements(List<Enhancement> enhancements) {
            this.enhancements = enhancements;
            return this;
        }

        public InitialData.Builder setRequestDataMap(Map<Integer, List<RequestData>> requestDataMap) {
            this.requestDataMap = requestDataMap;
            return this;
        }

        public InitialData build() {
            return new InitialData(connectionNode, enhancementNodes, enhancements, requestDataMap);
        }
    }
}
