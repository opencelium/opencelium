package com.becon.opencelium.backend.version_manager.template;

import com.becon.opencelium.backend.resource.connection.ConditionDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.version_manager.Wrapper;
import com.becon.opencelium.backend.version_manager.base.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class Template43Updater implements TemplateUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_3;
    private final Template40Updater template40Updater;
    private final ObjectMapper objectMapper;

    public Template43Updater(Template40Updater template40Updater, ObjectMapper objectMapper) {
        this.template40Updater = template40Updater;
        this.objectMapper = objectMapper;
    }

    @Override
    @SuspendException
    public Wrapper<Template> updateToCurrentVersion(Template template) {
        return updateFrom(template, template.getVersion());
    }

    @Override
    @SuspendException
    public Wrapper<Template> updateFrom(Template template, String oldVersion) {
        if (Objects.isNull(template) || Objects.equals(oldVersion, currentVersion.getVersion()))
            return Wrapper.notUpdated(template);

        oldVersion = oldVersion.replaceAll("[^\\d.]", "");

        if (StringUtils.isBlank(oldVersion) || Utils.compare(oldVersion, "4.0") < 0) {
            Wrapper<Template> updatedTo4_0 = template40Updater.updateFrom(template, oldVersion);
            if (!updatedTo4_0.isUpdated()) {
                return updatedTo4_0;
            }
            Wrapper<Template> result = updateFromInternal(updatedTo4_0.getData(), updatedTo4_0.getNewVersion());
            return Wrapper.updated(result.getData())
                    .changed(true)
                    .withOldVersion(oldVersion)
                    .withNewVersion(currentVersion.getVersion());
        } else if (Utils.compare(oldVersion, "4.0") >= 0) {
            return updateFromInternal(template, oldVersion);
        }
        return Wrapper.notUpdated(template);
    }

    private Wrapper<Template> updateFromInternal(Template template, String oldVersion) {
        template.setVersion(currentVersion.getVersion());
        CtionTemplateResource connection = template.getConnection();

        Reference<Boolean> changed = new Reference<>(false);

        if (Objects.nonNull(connection.getFromConnector().getMethods())) {
            List<MethodDTO> fromMethods = objectMapper.convertValue(connection.getFromConnector().getMethods(), new TypeReference<>() {
            });
            fromMethods.forEach(x -> update(x, changed));
            connection.getFromConnector().setMethods(fromMethods);
        }
        if (Objects.nonNull(connection.getFromConnector().getOperators())) {
            List<OperatorDTO> fromOperators = objectMapper.convertValue(connection.getFromConnector().getOperators(), new TypeReference<>() {
            });
            fromOperators.forEach(x -> update(x, changed));
            connection.getFromConnector().setOperators(fromOperators);
        }
        if (Objects.nonNull(connection.getToConnector().getMethods())) {
            List<MethodDTO> toMethods = objectMapper.convertValue(connection.getToConnector().getMethods(), new TypeReference<>() {
            });
            toMethods.forEach(x -> update(x, changed));
            connection.getToConnector().setMethods(toMethods);
        }
        if (Objects.nonNull(connection.getToConnector().getOperators())) {
            List<OperatorDTO> toOperators = objectMapper.convertValue(connection.getToConnector().getOperators(), new TypeReference<>() {
            });
            toOperators.forEach(x -> update(x, changed));
            connection.getToConnector().setOperators(toOperators);
        }
        if (Objects.nonNull(connection.getFieldBinding())) {
            List<FieldBindingDTO> fieldBindings = objectMapper.convertValue(connection.getFieldBinding(), new TypeReference<>() {
            });

            fieldBindings.forEach(x -> update(x, changed));
            connection.setFieldBinding(fieldBindings);
        }

        return Wrapper.updated(template)
                .changed(changed.getValue())
                .withOldVersion(oldVersion)
                .withNewVersion(currentVersion.getVersion());
    }

    private void update(FieldBindingDTO fieldBinding, Reference<Boolean> changed) {
        if (Objects.nonNull(fieldBinding)) {
            if (Objects.nonNull(fieldBinding.getFrom())) {
                fieldBinding.getFrom().forEach(x -> {
                    if (Objects.nonNull(x)) {
                        if (!StringUtils.isBlank(x.getType())){
                            x.setField(Version43Utils.replace(x.getField(), changed, true, Objects.equals(x.getType(), "header")));
                        }
                    }
                });
            }
            if (Objects.nonNull(fieldBinding.getTo())) {
                fieldBinding.getTo().forEach(x -> {
                    if (Objects.nonNull(x)) {
                        if (!StringUtils.isBlank(x.getType())){
                            x.setField(Version43Utils.replace(x.getField(), changed, true, Objects.equals(x.getType(), "header")));
                        }
                    }
                });
            }
            if (Objects.nonNull(fieldBinding.getEnhancement())) {
                if (Objects.nonNull(fieldBinding.getEnhancement().getArgs())) {
                    fieldBinding.getEnhancement().setArgs(Version43Utils.replace(fieldBinding.getEnhancement().getArgs(), changed));
                }
            }
        }
    }

    private void update(OperatorDTO operator, Reference<Boolean> changed) {
        if (!Objects.isNull(operator) && !Objects.isNull(operator.getCondition())) {
            ConditionDTO condition = operator.getCondition();
            StatementDTO leftStatement = condition.getLeftStatement();
            StatementDTO rightStatement = condition.getRightStatement();
            if (Objects.nonNull(leftStatement)) {
                if (!StringUtils.isBlank(leftStatement.getType())){
                    leftStatement.setField(Version43Utils.replace(leftStatement.getField(), changed, true, Objects.equals(leftStatement.getType(), "header")));
                }
            }
            if (Objects.nonNull(rightStatement)) {
                if (!StringUtils.isBlank(rightStatement.getType())){
                    rightStatement.setField(Version43Utils.replace(rightStatement.getField(), changed, true, Objects.equals(rightStatement.getType(), "header")));
                }
            }
        }
    }

    private void update(MethodDTO method, Reference<Boolean> changed) {
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
}
