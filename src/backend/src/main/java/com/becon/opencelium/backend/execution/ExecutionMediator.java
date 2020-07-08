package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;

import java.util.List;
import java.util.Map;

public interface ExecutionMediator {

    ConnectionNode getConnectionNode();
    List<EnhancementNode> getEnhancementNodes();
    List<Enhancement> getEnhancements();
    Map<String, List<RequestData>> requestDataMap();
}
