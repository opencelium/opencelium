package com.becon.opencelium.backend.versionmanager.connectionmng;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.versionmanager.Wrapper;
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
 *   <li>Prefixes from-side indexes with {@code "0_"} and to-side indexes with {@code "1_"}.</li>
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
    private static final String FROM_INDEX_PREFIX = "0_";
    private static final String TO_INDEX_PREFIX = "1_";

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

        List<MethodMng> mergedMethods = new ArrayList<>();
        mergedMethods.addAll(stampMethods(methodsOf(oldFrom), fromRef, FROM_INDEX_PREFIX));
        mergedMethods.addAll(stampMethods(methodsOf(oldTo), toRef, TO_INDEX_PREFIX));

        List<OperatorMng> mergedOperators = new ArrayList<>();
        mergedOperators.addAll(reindexOperators(operatorsOf(oldFrom), FROM_INDEX_PREFIX));
        mergedOperators.addAll(reindexOperators(operatorsOf(oldTo), TO_INDEX_PREFIX));

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

    private static List<MethodMng> stampMethods(List<MethodMng> methods, MethodConnectorMng ref, String indexPrefix) {
        for (MethodMng method : methods) {
            if (method == null) continue;
            method.setConnector(ref);
            method.setIndex(prefixIndex(method.getIndex(), indexPrefix));
        }
        return methods;
    }

    private static List<OperatorMng> reindexOperators(List<OperatorMng> operators, String indexPrefix) {
        for (OperatorMng operator : operators) {
            if (operator == null) continue;
            operator.setIndex(prefixIndex(operator.getIndex(), indexPrefix));
        }
        return operators;
    }

    private static String prefixIndex(String index, String prefix) {
        return prefix + index;
    }
}
