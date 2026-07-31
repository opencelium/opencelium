package com.becon.opencelium.backend.versionmanager.template;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.resource.connection.MethodConnectorDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.resource.template.CtorTemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.versionmanager.Wrapper;
import com.becon.opencelium.backend.versionmanager.base.FlowIndexUtils;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Brings a Template up to the v5.0 multi-connector layout:
 * <ul>
 *   <li>Stamps every method with the connector it originally belonged to (MethodConnectorDTO).</li>
 *   <li>Keeps from-side indexes unchanged and shifts the root component of every to-side index
 *       so the to-side flow continues the from-side flow at root level.</li>
 *   <li>Merges all from/to methods + operators under a single {@code fromConnector}.</li>
 *   <li>Sets {@code fromConnector.connectorId = -1} and {@code title = "DEFAULT"}.</li>
 *   <li>Clears {@code toConnector}.</li>
 *   <li>Leaves {@code fieldBinding} untouched.</li>
 * </ul>
 * Runs only on the read path; the persisted file is not modified.
 */
@Component
public class Template50Updater implements TemplateUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_5_0;
    private static final Logger log = LoggerFactory.getLogger(Template50Updater.class);

    private final Template44Updater template44Updater;
    private final ObjectMapper objectMapper;

    public Template50Updater(Template44Updater template44Updater, ObjectMapper objectMapper) {
        this.template44Updater = template44Updater;
        this.objectMapper = objectMapper;
    }

    @Override
    public Wrapper<Template> updateToCurrentVersion(Template template) {
        return updateFromInternal(template, template == null ? null : template.getVersion());
    }

    @Override
    public Wrapper<Template> updateFrom(Template template, String oldVersion) {
        return updateFromInternal(template, oldVersion);
    }

    private Wrapper<Template> updateFromInternal(Template template, String oldVersion) {
        if (Objects.isNull(template) || Utils.compare(currentVersion.getVersion(), oldVersion) <= 0) {
            return Wrapper.notUpdated(template);
        }

        if (Utils.compare(oldVersion, UpdaterVersion.VERSION_4_4.getVersion()) < 0) {
            template44Updater.updateFrom(template, oldVersion);
        }

        CtionTemplateResource connection = template.getConnection();
        if (connection == null) {
            template.setVersion(currentVersion.getVersion());
            return Wrapper.updated(template).changed(true)
                    .withOldVersion(oldVersion).withNewVersion(currentVersion.getVersion());
        }

        CtorTemplateResource oldFrom = connection.getFromConnector();
        CtorTemplateResource oldTo = connection.getToConnector();

        MethodConnectorDTO fromRef = refOf(oldFrom);
        MethodConnectorDTO toRef = refOf(oldTo);

        List<MethodDTO> fromMethods = methodsOf(oldFrom);
        List<OperatorDTO> fromOperators = operatorsOf(oldFrom);

        // To-side root indexes continue right after the from-side root indexes.
        int toOffset = FlowIndexUtils.rootOffset(indexesOf(fromMethods, fromOperators));

        List<MethodDTO> mergedMethods = new ArrayList<>();
        mergedMethods.addAll(stampMethods(fromMethods, fromRef, 0));
        mergedMethods.addAll(stampMethods(methodsOf(oldTo), toRef, toOffset));

        List<OperatorDTO> mergedOperators = new ArrayList<>();
        mergedOperators.addAll(reindexOperators(fromOperators, 0));
        mergedOperators.addAll(reindexOperators(operatorsOf(oldTo), toOffset));

        CtorTemplateResource merged = new CtorTemplateResource();
        merged.setConnectorId(ConnectionConstants.DEFAULT_CONNECTOR_ID);
        merged.setTitle(ConnectionConstants.DEFAULT_CONNECTOR_NAME);
        merged.setNodeId(oldFrom != null ? oldFrom.getNodeId() : null);
        merged.setInvoker(oldFrom != null ? oldFrom.getInvoker() : null);
        merged.setMethods(mergedMethods);
        merged.setOperators(mergedOperators);

        connection.setFromConnector(merged);
        connection.setToConnector(null);
        template.setVersion(currentVersion.getVersion());

        return Wrapper.updated(template).changed(true)
                .withOldVersion(oldVersion).withNewVersion(currentVersion.getVersion());
    }

    private MethodConnectorDTO refOf(CtorTemplateResource connector) {
        if (connector == null) return null;
        MethodConnectorDTO ref = new MethodConnectorDTO();
        ref.setConnectorId(connector.getConnectorId());
        ref.setTitle(connector.getTitle());
        ref.setInvoker(connector.getInvoker() != null ? connector.getInvoker().getName() : null);
        return ref;
    }

    private List<MethodDTO> methodsOf(CtorTemplateResource connector) {
        if (connector == null || connector.getMethods() == null) return List.of();
        try {
            return objectMapper.convertValue(connector.getMethods(), new TypeReference<>() {});
        } catch (Exception e) {
            log.error("Failed to read methods from template connector [connectorId={}]", connector.getConnectorId(), e);
            return List.of();
        }
    }

    private List<OperatorDTO> operatorsOf(CtorTemplateResource connector) {
        if (connector == null || connector.getOperators() == null) return List.of();
        try {
            return objectMapper.convertValue(connector.getOperators(), new TypeReference<>() {});
        } catch (Exception e) {
            log.error("Failed to read operators from template connector [connectorId={}]", connector.getConnectorId(), e);
            return List.of();
        }
    }

    private static List<MethodDTO> stampMethods(List<MethodDTO> methods, MethodConnectorDTO ref, int rootOffset) {
        for (MethodDTO method : methods) {
            if (method == null) continue;
            method.setConnector(ref);
            method.setIndex(FlowIndexUtils.shiftRoot(method.getIndex(), rootOffset));
        }
        return methods;
    }

    private static List<OperatorDTO> reindexOperators(List<OperatorDTO> operators, int rootOffset) {
        for (OperatorDTO operator : operators) {
            if (operator == null) continue;
            operator.setIndex(FlowIndexUtils.shiftRoot(operator.getIndex(), rootOffset));
        }
        return operators;
    }

    /** Collects the flow indexes of every from-side method and operator. */
    private static List<String> indexesOf(List<MethodDTO> methods, List<OperatorDTO> operators) {
        List<String> indexes = new ArrayList<>();
        for (MethodDTO method : methods) {
            if (method != null) indexes.add(method.getIndex());
        }
        for (OperatorDTO operator : operators) {
            if (operator != null) indexes.add(operator.getIndex());
        }
        return indexes;
    }
}
