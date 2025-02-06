package com.becon.opencelium.backend.version_manager.connectionmng;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.version_manager.Wrapper;
import com.becon.opencelium.backend.version_manager.backup.Backup;
import com.becon.opencelium.backend.version_manager.base.Reference;
import com.becon.opencelium.backend.version_manager.base.SuspendException;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import com.becon.opencelium.backend.version_manager.base.Version43Utils;
import io.micrometer.common.util.StringUtils;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Objects;

@Component
public class Connection43MngUpdater implements ConnectionMngUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_3;

    @Override
    @Backup
    @SuspendException
    public Wrapper<ConnectionMng> updateToCurrentVersion(ConnectionMng connection) {
        return Objects.isNull(connection)
                ? Wrapper.notUpdated(null)
                : updateFromInternal(connection, connection.getVersion());
    }

    @Override
    @Backup
    @SuspendException
    public Wrapper<ConnectionMng> updateFrom(ConnectionMng connection, String oldVersion) {
        return updateFromInternal(connection, oldVersion);
    }

    private Wrapper<ConnectionMng> updateFromInternal(ConnectionMng connection, String oldVersion){
        if (Objects.isNull(connection) || Objects.equals(oldVersion, currentVersion.getVersion()))
            return Wrapper.notUpdated(connection);

        connection.setVersion(currentVersion.getVersion());

        Reference<Boolean> changed = new Reference<>(false);

        if (!Objects.isNull(connection.getFromConnector().getMethods())) {
            connection.getFromConnector().getMethods().forEach(x -> update(x, changed));
        }
        if (!Objects.isNull(connection.getFromConnector().getOperators())) {
            connection.getFromConnector().getOperators().forEach(x -> update(x, changed));
        }
        if (!Objects.isNull(connection.getToConnector().getMethods())) {
            connection.getToConnector().getMethods().forEach(x -> update(x, changed));
        }
        if (!Objects.isNull(connection.getToConnector().getOperators())) {
            connection.getToConnector().getOperators().forEach(x -> update(x, changed));
        }
        if (!Objects.isNull(connection.getFieldBindings())) {
            connection.getFieldBindings().forEach(x -> update(x, changed));
        }

        return Wrapper.updated(connection)
                .changed(changed.getValue())
                .withOldVersion(oldVersion)
                .withNewVersion(currentVersion.getVersion());
    }

    private void update(OperatorMng operator, Reference<Boolean> changed) {
        if (!Objects.isNull(operator) && !Objects.isNull(operator.getCondition())) {
            ConditionMng condition = operator.getCondition();
            StatementMng leftStatement = condition.getLeftStatement();
            StatementMng rightStatement = condition.getRightStatement();
            if (!Objects.isNull(leftStatement)) {
                if (!StringUtils.isBlank(leftStatement.getType())) {
                    leftStatement.setField(Version43Utils.replace(leftStatement.getField(), changed, true, Objects.equals(leftStatement.getType(), "header")));
                }
            }
            if (!Objects.isNull(rightStatement)) {
                if (!StringUtils.isBlank(rightStatement.getType())){
                    rightStatement.setField(Version43Utils.replace(rightStatement.getField(), changed, true, Objects.equals(rightStatement.getType(), "header")));
                }
            }
        }
    }

    private void update(MethodMng method, Reference<Boolean> changed) {
        if (!Objects.isNull(method) && !Objects.isNull(method.getRequest())) {
            Map<String, String> headers = method.getRequest().getHeader();
            BodyMng body = method.getRequest().getBody();

            // replacing in headers
            if (!Objects.isNull(headers)) {
                headers.entrySet().forEach(entry -> entry.setValue(Version43Utils.replace(entry.getValue(), changed)));
            }
            // replacing in endpoint
            method.getRequest().setEndpoint(Version43Utils.replace(method.getRequest().getEndpoint(), changed));

            // replacing in body
            if (Objects.nonNull(body) && Objects.nonNull(body.getFields())) {
                body.setFields(Version43Utils.updateMap(body.getFields(), changed));
            }
        }
    }

    private void update(FieldBindingMng fieldBindingMng, Reference<Boolean> changed) {
        if (Objects.nonNull(fieldBindingMng)) {
            if (Objects.nonNull(fieldBindingMng.getFrom())) {
                fieldBindingMng.getFrom().forEach(x -> {
                    if (Objects.nonNull(x)) {
                        if (!StringUtils.isBlank(x.getType())){
                            x.setField(Version43Utils.replace(x.getField(), changed, true, Objects.equals(x.getType(), "header")));
                        }
                    }
                });
            }
            if (Objects.nonNull(fieldBindingMng.getTo())) {
                fieldBindingMng.getTo().forEach(x -> {
                    if (Objects.nonNull(x)) {
                        if (!StringUtils.isBlank(x.getType())){
                            x.setField(Version43Utils.replace(x.getField(), changed, true, Objects.equals(x.getType(), "header")));
                        }
                    }
                });
            }
            if (Objects.nonNull(fieldBindingMng.getEnhancement())) {
                if (Objects.nonNull(fieldBindingMng.getEnhancement().getArgs())) {
                    fieldBindingMng.getEnhancement().setArgs(Version43Utils.replace(fieldBindingMng.getEnhancement().getArgs(), changed));
                }
            }
        }
    }
}
