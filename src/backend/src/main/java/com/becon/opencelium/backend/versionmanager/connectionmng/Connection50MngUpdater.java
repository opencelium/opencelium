package com.becon.opencelium.backend.versionmanager.connectionmng;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.versionmanager.Wrapper;
import com.becon.opencelium.backend.versionmanager.base.FlowIndexUtils;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Brings a ConnectionMng up to the v5.0 multi-connector layout:
 * <ul>
 *   <li>Stamps every method with the connector it originally belonged to (MethodConnectorMng).</li>
 *   <li>Keeps from-side indexes unchanged and shifts the root component of every to-side index
 *       so the to-side flow continues the from-side flow at root level.</li>
 *   <li>Merges all from/to methods + operators under a single {@code fromConnector}.</li>
 *   <li>Sets {@code fromConnector.connectorId = -1} and {@code title = "DEFAULT"};
 *       {@code flowId} is preserved from the original fromConnector.</li>
 *   <li>Clears {@code toConnector}.</li>
 *   <li>Leaves {@code fieldBindings} untouched — they reference methods by color code.</li>
 * </ul>
 * Runs only on the read path; the persisted document is not modified.
 */
@Component
public class Connection50MngUpdater implements ConnectionMngUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_5_0;

    private final Connection48MngUpdater connection48MngUpdater;

    public Connection50MngUpdater(Connection48MngUpdater connection48MngUpdater) {
        this.connection48MngUpdater = connection48MngUpdater;
    }

    @Override
    public Wrapper<ConnectionMng> updateToCurrentVersion(ConnectionMng connection) {
        return updateFromInternal(connection, connection == null ? null : connection.getVersion());
    }

    @Override
    public Wrapper<ConnectionMng> updateFrom(ConnectionMng connection, String oldVersion) {
        return updateFromInternal(connection, oldVersion);
    }

    private Wrapper<ConnectionMng> updateFromInternal(ConnectionMng connection, String oldVersion) {
        if (Objects.isNull(connection) || Utils.compare(currentVersion.getVersion(), oldVersion) <= 0) {
            return Wrapper.notUpdated(connection);
        }

        // Bring older documents up to 4.8 first; chained updater no-ops when already >= 4.8.
        if (Utils.compare(oldVersion, UpdaterVersion.VERSION_4_8.getVersion()) < 0) {
            connection48MngUpdater.updateFrom(connection, oldVersion);
        }

        ConnectorMng oldFrom = connection.getFromConnector();
        ConnectorMng oldTo = connection.getToConnector();

        MethodConnectorMng fromRef = refOf(oldFrom);
        MethodConnectorMng toRef = refOf(oldTo);

        // To-side root indexes continue right after the from-side root indexes.
        int toOffset = FlowIndexUtils.rootOffset(indexesOf(oldFrom));

        List<MethodMng> mergedMethods = new ArrayList<>();
        mergedMethods.addAll(stampMethods(methodsOf(oldFrom), fromRef, 0));
        mergedMethods.addAll(stampMethods(methodsOf(oldTo), toRef, toOffset));

        List<OperatorMng> mergedOperators = new ArrayList<>();
        mergedOperators.addAll(reindexOperators(operatorsOf(oldFrom), 0));
        mergedOperators.addAll(reindexOperators(operatorsOf(oldTo), toOffset));

        ConnectorMng merged = new ConnectorMng();
        merged.setConnectorId(ConnectionConstants.DEFAULT_CONNECTOR_ID);
        merged.setTitle(ConnectionConstants.DEFAULT_CONNECTOR_NAME);
        merged.setFlowId(oldFrom != null ? oldFrom.getFlowId() : null);
        merged.setMethods(mergedMethods);
        merged.setOperators(mergedOperators);

        connection.setFromConnector(merged);
        connection.setToConnector(null);
        connection.setVersion(currentVersion.getVersion());

        return Wrapper.updated(connection)
                .changed(true)
                .withOldVersion(oldVersion)
                .withNewVersion(currentVersion.getVersion());
    }

    private static MethodConnectorMng refOf(ConnectorMng connector) {
        if (connector == null) return null;
        MethodConnectorMng ref = new MethodConnectorMng();
        ref.setConnectorId(connector.getConnectorId());
        ref.setTitle(connector.getTitle());
        return ref;
    }

    private static List<MethodMng> methodsOf(ConnectorMng connector) {
        if (connector == null || connector.getMethods() == null) return List.of();
        return connector.getMethods();
    }

    private static List<OperatorMng> operatorsOf(ConnectorMng connector) {
        if (connector == null || connector.getOperators() == null) return List.of();
        return connector.getOperators();
    }

    private static List<MethodMng> stampMethods(List<MethodMng> methods, MethodConnectorMng ref, int rootOffset) {
        for (MethodMng method : methods) {
            if (method == null) continue;
            method.setConnector(ref);
            method.setIndex(FlowIndexUtils.shiftRoot(method.getIndex(), rootOffset));
        }
        return methods;
    }

    private static List<OperatorMng> reindexOperators(List<OperatorMng> operators, int rootOffset) {
        for (OperatorMng operator : operators) {
            if (operator == null) continue;
            operator.setIndex(FlowIndexUtils.shiftRoot(operator.getIndex(), rootOffset));
        }
        return operators;
    }

    /** Collects the flow indexes of every method and operator of {@code connector}. */
    private static List<String> indexesOf(ConnectorMng connector) {
        List<String> indexes = new ArrayList<>();
        for (MethodMng method : methodsOf(connector)) {
            if (method != null) indexes.add(method.getIndex());
        }
        for (OperatorMng operator : operatorsOf(connector)) {
            if (operator != null) indexes.add(operator.getIndex());
        }
        return indexes;
    }
}
