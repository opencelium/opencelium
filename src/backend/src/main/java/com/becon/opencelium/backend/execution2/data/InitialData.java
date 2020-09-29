package com.becon.opencelium.backend.execution2.data;

import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

public class InitialData {
    private final ConnectionNode connectionNode; // stores method, operator and field nodes
    private final List<EnhancementNode> enhancementNodes; // stores link between fields
    private final List<Enhancement> enhancements; // stores programming language code for managing data in enhancement
    private final Map<Integer, List<RequestData>> requestDataMap; // contains request data of connectors
    private final InvokerService invokerService; // need to get data from invoker files
    private final RestTemplate restTemplate;

    private InitialData(ConnectionNode connectionNode, List<EnhancementNode> enhancementNodes,
                          List<Enhancement> enhancements, Map<Integer, List<RequestData>> requestDataMap,
                          InvokerService invokerService, RestTemplate restTemplate) {
        this.connectionNode = connectionNode;
        this.enhancementNodes = enhancementNodes;
        this.enhancements = enhancements;
        this.requestDataMap = requestDataMap;
        this.invokerService = invokerService;
        this.restTemplate = restTemplate;
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

    public InvokerService getInvokerService() {
        return invokerService;
    }

    public RestTemplate getRestTemplate() {
        return restTemplate;
    }

    // ----------------------------------- Builder ---------------------------------------------------- //
    public static class Builder {
        private ConnectionNode connectionNode;
        private List<EnhancementNode> enhancementNodes;
        private List<Enhancement> enhancements;
        private Map<Integer, List<RequestData>> requestDataMap;
        private InvokerService invokerService;
        private RestTemplate restTemplate;

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

        public InitialData.Builder setInvokerService(InvokerService invokerService) {
            this.invokerService = invokerService;
            return this;
        }

        public InitialData.Builder setRestTemplate(RestTemplate restTemplate) {
            this.restTemplate = restTemplate;
            return this;
        }

        public InitialData build() {
            return new InitialData(connectionNode, enhancementNodes, enhancements, requestDataMap,
                    invokerService, restTemplate);
        }
    }
}
