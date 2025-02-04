package com.becon.opencelium.backend.version_manager.template;

import com.becon.opencelium.backend.mapper.others.FieldBindingOldDTOMapper;
import com.becon.opencelium.backend.mapper.others.MethodOldDTOMapper;
import com.becon.opencelium.backend.mapper.others.OperatorOldDTOMapper;
import com.becon.opencelium.backend.resource.connection.old.FieldBindingOldDTO;
import com.becon.opencelium.backend.resource.connection.old.MethodOldDTO;
import com.becon.opencelium.backend.resource.connection.old.OperatorOldDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.version_manager.EntityUpdater;
import com.becon.opencelium.backend.version_manager.Wrapper;
import com.becon.opencelium.backend.version_manager.base.SuspendException;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

@Component
public class Template40Updater implements EntityUpdater<Template> {

    private final ObjectMapper objectMapper;
    private final MethodOldDTOMapper methodOldDTOMapper;
    private final OperatorOldDTOMapper operatorOldDTOMapper;
    private final FieldBindingOldDTOMapper fieldBindingOldDTOMapper;

    private final UpdaterVersion updaterVersion = UpdaterVersion.VERSION_4_0;

    public Template40Updater(ObjectMapper objectMapper, MethodOldDTOMapper methodOldDTOMapper, OperatorOldDTOMapper operatorOldDTOMapper, FieldBindingOldDTOMapper fieldBindingOldDTOMapper) {
        this.objectMapper = objectMapper;
        this.methodOldDTOMapper = methodOldDTOMapper;
        this.operatorOldDTOMapper = operatorOldDTOMapper;
        this.fieldBindingOldDTOMapper = fieldBindingOldDTOMapper;
    }

    @Override
    @SuspendException
    public Wrapper<Template> updateToCurrentVersion(Template template) {
        return updateFrom(template, template.getVersion());
    }

    @Override
    @SuspendException
    public Wrapper<Template> updateFrom(Template template, String oldVersion) {
        if (Objects.isNull(template) || Objects.equals(oldVersion, updaterVersion.getVersion()))
            return Wrapper.notUpdated(template);

        template.setVersion(updaterVersion.getVersion());
        CtionTemplateResource connection = template.getConnection();

        if (Objects.nonNull(connection.getFromConnector().getMethods())) {
            List<MethodOldDTO> fromMethods = objectMapper.convertValue(connection.getFromConnector().getMethods(), new TypeReference<>() {
            });
            connection.getFromConnector().setMethods(methodOldDTOMapper.toEntityAll(fromMethods));
        }
        if (Objects.nonNull(connection.getFromConnector().getOperators())) {
            List<OperatorOldDTO> fromOperators = objectMapper.convertValue(connection.getFromConnector().getOperators(), new TypeReference<>() {
            });
            connection.getFromConnector().setOperators(operatorOldDTOMapper.toEntityAll(fromOperators));
        }
        if (Objects.nonNull(connection.getToConnector().getMethods())) {
            List<MethodOldDTO> toMethods = objectMapper.convertValue(connection.getToConnector().getMethods(), new TypeReference<>() {
            });
            connection.getToConnector().setMethods(methodOldDTOMapper.toEntityAll(toMethods));
        }
        if (Objects.nonNull(connection.getToConnector().getOperators())) {
            List<OperatorOldDTO> toOperators = objectMapper.convertValue(connection.getToConnector().getOperators(), new TypeReference<>() {
            });
            connection.getToConnector().setOperators(operatorOldDTOMapper.toEntityAll(toOperators));
        }
        if (Objects.nonNull(connection.getFieldBinding())) {
            List<FieldBindingOldDTO> fieldBindings = objectMapper.convertValue(connection.getFieldBinding(), new TypeReference<>() {
            });
            connection.setFieldBinding(fieldBindingOldDTOMapper.toEntityAll(fieldBindings));
        }

        return Wrapper.updated(template)
                .changed(true)
                .withOldVersion(oldVersion)
                .withNewVersion(updaterVersion.getVersion());
    }
}
