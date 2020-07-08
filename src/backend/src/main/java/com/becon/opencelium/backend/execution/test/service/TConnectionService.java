package com.becon.opencelium.backend.execution.test.service;

import com.becon.opencelium.backend.execution.test.entity.TConnection;
import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.resource.connection.test.TestConnectionResource;

import java.util.List;

public interface TConnectionService {
    TConnection run(ConnectionNode connectionNode, List<EnhancementNode> enhancementNodes, List<Enhancement> enhancements);

    TestConnectionResource toResource(TConnection tConnection);

    ConnectionNode fillTemporaryIds(ConnectionNode node);
}
