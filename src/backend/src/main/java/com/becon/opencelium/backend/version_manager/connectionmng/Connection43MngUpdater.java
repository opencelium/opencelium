package com.becon.opencelium.backend.version_manager.connectionmng;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.version_manager.Wrapper;
import com.becon.opencelium.backend.version_manager.base.Reference;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import com.becon.opencelium.backend.version_manager.base.Utils;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class Connection43MngUpdater implements ConnectionMngUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_3;

    private Connection43MngUpdater() {
    }

    @Override
    public Wrapper<ConnectionMng> updateToCurrentVersion(ConnectionMng connection) {
        return Objects.isNull(connection)
                ? Wrapper.notUpdated(null)
                : updateFrom(connection, connection.getVersion());
    }

    @Override
    public Wrapper<ConnectionMng> updateFrom(ConnectionMng connection, String oldVersion) {
        if (Objects.isNull(connection) || Objects.equals(oldVersion, currentVersion.getVersion()))
            return Wrapper.notUpdated(connection);

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
                leftStatement.setField(replace(leftStatement.getField(), changed, true, Objects.equals(leftStatement.getType(), "header")));
            }
            if (!Objects.isNull(rightStatement)) {
                rightStatement.setField(replace(rightStatement.getField(), changed, true, Objects.equals(rightStatement.getType(), "header")));
            }
        }
    }

    private void update(MethodMng method, Reference<Boolean> changed) {
        if (!Objects.isNull(method) && !Objects.isNull(method.getRequest())) {
            Map<String, String> headers = method.getRequest().getHeader();
            BodyMng body = method.getRequest().getBody();

            // replacing in headers
            if (!Objects.isNull(headers)) {
                headers.entrySet().forEach(entry -> entry.setValue(replace(entry.getValue(), changed)));
            }
            // replacing in endpoint
            method.getRequest().setEndpoint(replace(method.getRequest().getEndpoint(), changed));

            // replacing in body
            if (!Objects.isNull(body.getFields())) {
                body.setFields(update(body.getFields(), changed));
            }
        }
    }

    private void update(FieldBindingMng fieldBindingMng, Reference<Boolean> changed) {
        if (Objects.nonNull(fieldBindingMng)) {
            if (Objects.nonNull(fieldBindingMng.getFrom())) {
                fieldBindingMng.getFrom().forEach(x -> {
                    if (Objects.nonNull(x)) {
                        x.setField(replace(x.getField(), changed, true, Objects.equals(x.getType(), "header")));
                    }
                });
            }
            if (Objects.nonNull(fieldBindingMng.getTo())) {
                fieldBindingMng.getTo().forEach(x -> {
                    if (Objects.nonNull(x)) {
                        x.setField(replace(x.getField(), changed, true, Objects.equals(x.getType(), "header")));
                    }
                });
            }
            if (Objects.nonNull(fieldBindingMng.getEnhancement())) {
                if (Objects.nonNull(fieldBindingMng.getEnhancement().getArgs())) {
                    fieldBindingMng.getEnhancement().setArgs(replace(fieldBindingMng.getEnhancement().getArgs(), changed));
                }
            }
        }
    }

    private Map<String, Object> update(Map<String, Object> obj, Reference<Boolean> changed) {
        for (Map.Entry<String, Object> entry : obj.entrySet()) {
            if (entry.getValue() instanceof String str) {
                entry.setValue(replace(str, changed));
            } else if (entry.getValue() instanceof Map<?, ?>) {
                @SuppressWarnings("unchecked") Map<String, Object> object = (Map<String, Object>) entry.getValue();
                entry.setValue(update(object, changed));
            } else if (entry.getValue() instanceof List<?> list) {
                entry.setValue(update(list, changed));
            }
        }
        return obj;
    }

    private List<?> update(List<?> list, Reference<Boolean> changed) {
        List<Object> responseList = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            Object obj = list.get(i);
            if (obj instanceof String str) {
                responseList.add(i, replace(str, changed));
            } else if (obj instanceof Map<?, ?>) {
                @SuppressWarnings("unchecked") Map<String, Object> object = (Map<String, Object>) obj;
                responseList.add(update(object, changed));
            } else if (obj instanceof List<?> innerList) {
                responseList.add(update(innerList, changed));
            } else {
                responseList.add(obj);
            }
        }
        return responseList;
    }

    private String replace(String rawStr, Reference<Boolean> changed) {
        return replace(rawStr, changed, false, false);
    }

    private String replace(String rawStr, Reference<Boolean> changed, boolean onlyField, boolean isHeader) {
        if (Objects.isNull(rawStr)) return null;

        if (onlyField) {
            if (!rawStr.startsWith("body.$.") && !rawStr.startsWith("header.$.") && !rawStr.equals("status")) {
                changed.setValue(true);
                return isHeader ? "header.$." + rawStr : "body.$." + rawStr;
            } else {
                String updatedStr = Utils.updateRefWith43Version(rawStr);
                if (!StringUtils.equals(updatedStr, rawStr)) {
                    changed.setValue(true);
                }
            }
        }
        return rawStr;
    }

    private static final Connection43MngUpdater instance = new Connection43MngUpdater();

    public static Connection43MngUpdater getInstance() {
        return instance;
    }
}
