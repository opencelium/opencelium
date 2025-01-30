package com.becon.opencelium.backend.version_manager.template;

import com.becon.opencelium.backend.resource.connection.ConditionDTO;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import com.becon.opencelium.backend.resource.connection.old.FieldBindingOldDTO;
import com.becon.opencelium.backend.resource.connection.old.MethodOldDTO;
import com.becon.opencelium.backend.resource.connection.old.OperatorOldDTO;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.version_manager.Wrapper;
import com.becon.opencelium.backend.version_manager.base.Reference;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import com.becon.opencelium.backend.version_manager.base.Version43Utils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class Template43Updater implements TemplateUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_3;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Template43Updater instance = new Template43Updater();

    public static Template43Updater getInstance() {
        return instance;
    }

    @Override
    public Wrapper<Template> updateToCurrentVersion(Template template) {
        return updateFrom(template, template.getVersion());
    }

    @Override
    public Wrapper<Template> updateFrom(Template template, String oldVersion) {
        if (Objects.isNull(template) || Objects.equals(oldVersion, currentVersion.getVersion()))
            return Wrapper.notUpdated(template);

        template.setVersion(currentVersion.getVersion());
        CtionTemplateResource connection = template.getConnection();

        Reference<Boolean> changed = new Reference<>(false);

        if (Objects.nonNull(connection.getFromConnector().getMethods())) {
            List<MethodOldDTO> fromMethods = objectMapper.convertValue(connection.getFromConnector().getMethods(), new TypeReference<>() {
            });
            fromMethods.forEach(x -> update(x, changed));
            connection.getFromConnector().setMethods(fromMethods);
        }
        if (Objects.nonNull(connection.getFromConnector().getOperators())) {
            List<OperatorOldDTO> fromOperators = objectMapper.convertValue(connection.getFromConnector().getOperators(), new TypeReference<>() {
            });
            fromOperators.forEach(x -> update(x, changed));
            connection.getFromConnector().setOperators(fromOperators);
        }
        if (Objects.nonNull(connection.getToConnector().getMethods())) {
            List<MethodOldDTO> toMethods = objectMapper.convertValue(connection.getToConnector().getMethods(), new TypeReference<>() {
            });
            toMethods.forEach(x -> update(x, changed));
            connection.getToConnector().setMethods(toMethods);
        }
        if (Objects.nonNull(connection.getToConnector().getOperators())) {
            List<OperatorOldDTO> toOperators = objectMapper.convertValue(connection.getToConnector().getOperators(), new TypeReference<>() {
            });
            toOperators.forEach(x -> update(x, changed));
            connection.getToConnector().setOperators(toOperators);
        }
        if (Objects.nonNull(connection.getFieldBinding())) {
            List<FieldBindingOldDTO> fieldBindings = objectMapper.convertValue(connection.getFieldBinding(), new TypeReference<>() {
            });

            fieldBindings.forEach(x -> update(x, changed));
            connection.setFieldBinding(fieldBindings);
        }

        return Wrapper.updated(template)
                .changed(changed.getValue())
                .withOldVersion(oldVersion)
                .withNewVersion(currentVersion.getVersion());
    }

    private void update(OperatorOldDTO operator, Reference<Boolean> changed) {
        if (!Objects.isNull(operator) && !Objects.isNull(operator.getCondition())) {
            ConditionDTO condition = operator.getCondition();
            StatementDTO leftStatement = condition.getLeftStatement();
            StatementDTO rightStatement = condition.getRightStatement();
            if (Objects.nonNull(leftStatement)) {
                leftStatement.setField(Version43Utils.replace(leftStatement.getField(), changed, true, Objects.equals(leftStatement.getType(), "header")));
            }
            if (Objects.nonNull(rightStatement)) {
                rightStatement.setField(Version43Utils.replace(rightStatement.getField(), changed, true, Objects.equals(rightStatement.getType(), "header")));
            }
        }
    }

    private void update(MethodOldDTO method, Reference<Boolean> changed) {
        if (Objects.nonNull(method) && Objects.nonNull(method.getRequest())) {
            Map<String, String> headers = method.getRequest().getHeader();
            BodyDTO body = method.getRequest().getBody();

            // replacing in headers
            if (Objects.nonNull(headers)) {
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

    private void update(FieldBindingOldDTO fieldBinding, Reference<Boolean> changed) {
        if (Objects.nonNull(fieldBinding)) {
            if (Objects.nonNull(fieldBinding.getFrom())) {
                fieldBinding.getFrom().forEach(x -> {
                    if (Objects.nonNull(x)) {
                        x.setField(Version43Utils.replace(x.getField(), changed, true, Objects.equals(x.getType(), "header")));
                    }
                });
            }
            if (Objects.nonNull(fieldBinding.getTo())) {
                fieldBinding.getTo().forEach(x -> {
                    if (Objects.nonNull(x)) {
                        x.setField(Version43Utils.replace(x.getField(), changed, true, Objects.equals(x.getType(), "header")));
                    }
                });
            }
            if (Objects.nonNull(fieldBinding.getEnhancement())) {
                if (Objects.nonNull(fieldBinding.getEnhancement().getExpertVar())) {
                    fieldBinding.getEnhancement().setExpertVar(Version43Utils.replace(fieldBinding.getEnhancement().getExpertVar(), changed));
                }
            }
        }
    }
}
