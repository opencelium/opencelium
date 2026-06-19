package com.becon.opencelium.backend.versionmanager.template;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.resource.connection.MethodConnectorDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.resource.template.CtorTemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.versionmanager.Wrapper;
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
 *   <li>Prefixes from-side indexes with {@code "0_"} and to-side indexes with {@code "1_"}.</li>
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
    private static final String FROM_INDEX_PREFIX = "0_";
    private static final String TO_INDEX_PREFIX = "1_";
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

        List<MethodDTO> mergedMethods = new ArrayList<>();
        mergedMethods.addAll(stampMethods(methodsOf(oldFrom), fromRef, FROM_INDEX_PREFIX));
        mergedMethods.addAll(stampMethods(methodsOf(oldTo), toRef, TO_INDEX_PREFIX));

        List<OperatorDTO> mergedOperators = new ArrayList<>();
        mergedOperators.addAll(reindexOperators(operatorsOf(oldFrom), FROM_INDEX_PREFIX));
        mergedOperators.addAll(reindexOperators(operatorsOf(oldTo), TO_INDEX_PREFIX));

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

    private static List<MethodDTO> stampMethods(List<MethodDTO> methods, MethodConnectorDTO ref, String indexPrefix) {
        for (MethodDTO method : methods) {
            if (method == null) continue;
            method.setConnector(ref);
            method.setIndex(prefixIndex(method.getIndex(), indexPrefix));
        }
        return methods;
    }

    private static List<OperatorDTO> reindexOperators(List<OperatorDTO> operators, String indexPrefix) {
        for (OperatorDTO operator : operators) {
            if (operator == null) continue;
            operator.setIndex(prefixIndex(operator.getIndex(), indexPrefix));
        }
        return operators;
    }

    private static String prefixIndex(String index, String prefix) {
        return prefix + index;
    }
}
