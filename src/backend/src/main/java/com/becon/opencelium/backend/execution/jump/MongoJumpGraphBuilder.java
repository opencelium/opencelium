package com.becon.opencelium.backend.execution.jump;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds a pure {@link JumpGraph} from the persistence model of a single connector.
 */
public final class MongoJumpGraphBuilder {

    private MongoJumpGraphBuilder() {
    }

    public static JumpGraph build(ConnectorMng connector) {
        List<JumpNode> nodes = new ArrayList<>();

        if (connector.getMethods() != null) {
            for (MethodMng method : connector.getMethods()) {
                nodes.add(JumpNode.method(method.getIndex(), method.getColor()));
            }
        }

        if (connector.getOperators() != null) {
            for (OperatorMng operator : connector.getOperators()) {
                nodes.add(JumpNode.operator(
                        operator.getIndex(),
                        NodeKind.ofOperatorType(operator.getType())));
            }
        }

        return new JumpGraph(nodes);
    }
}
