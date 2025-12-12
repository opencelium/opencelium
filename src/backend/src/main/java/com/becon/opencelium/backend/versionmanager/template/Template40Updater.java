package com.becon.opencelium.backend.versionmanager.template;

import com.becon.opencelium.backend.mapper.others.OperatorOldDTOMapper;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.old.OperatorOldDTO;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import com.becon.opencelium.backend.resource.connector.ResponseDTO;
import com.becon.opencelium.backend.resource.connector.ResultDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.Wrapper;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import com.becon.opencelium.backend.versionmanager.template.domains.MethodWithDirectBody;
import com.becon.opencelium.backend.versionmanager.template.domains.RequestWithDirectBody;
import com.becon.opencelium.backend.versionmanager.template.domains.ResponseWithDirectBody;
import com.becon.opencelium.backend.versionmanager.template.domains.ResultWithDirectBody;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class Template40Updater implements EntityUpdater<Template> {

    private static final Logger log = LoggerFactory.getLogger(Template40Updater.class);
    private final ObjectMapper objectMapper;
    private final OperatorOldDTOMapper operatorOldDTOMapper;

    private final UpdaterVersion updaterVersion = UpdaterVersion.VERSION_4_0;

    public Template40Updater(ObjectMapper objectMapper, OperatorOldDTOMapper operatorOldDTOMapper) {
        this.objectMapper = objectMapper;
        this.operatorOldDTOMapper = operatorOldDTOMapper;
    }

    @Override
    public Wrapper<Template> updateToCurrentVersion(Template template) {
        return updateFrom(template, template.getVersion());
    }

    @Override
    public Wrapper<Template> updateFrom(Template template, String oldVersion) {
        if (Objects.isNull(template) || Utils.compare(updaterVersion.getVersion(), oldVersion) <= 0)
            return Wrapper.notUpdated(template);

        template.setVersion(updaterVersion.getVersion());
        CtionTemplateResource connection = template.getConnection();

        if (Objects.nonNull(connection.getFromConnector().getMethods())) {
            List<MethodWithDirectBody> fromMethods = null;
            try {
                fromMethods = objectMapper.convertValue(connection.getFromConnector().getMethods(), new TypeReference<>() {
                });
            } catch (IllegalArgumentException e) {
                log.error("Failed to read methods on template");
                throw e;
            }

            connection.getFromConnector().setMethods(resolveMethods(fromMethods));
        }
        if (Objects.nonNull(connection.getFromConnector().getOperators())) {
            List<OperatorOldDTO> fromOperators = null;
            try {
                fromOperators = objectMapper.convertValue(connection.getFromConnector().getOperators(), new TypeReference<>() {
                });
            } catch (IllegalArgumentException e) {
                log.error("Failed to read operators on template");
                throw e;
            }
            connection.getFromConnector().setOperators(operatorOldDTOMapper.toEntityAll(fromOperators));
        }
        if (Objects.nonNull(connection.getToConnector().getMethods())) {
            List<MethodWithDirectBody> toMethods = null;
            try {
                toMethods = objectMapper.convertValue(connection.getToConnector().getMethods(), new TypeReference<>() {
                });
            } catch (IllegalArgumentException e) {
                log.error("Failed to read methods on template");
                throw e;
            }

            connection.getToConnector().setMethods(resolveMethods(toMethods));
        }
        if (Objects.nonNull(connection.getToConnector().getOperators())) {
            List<OperatorOldDTO> toOperators = null;
            try {
                toOperators = objectMapper.convertValue(connection.getToConnector().getOperators(), new TypeReference<>() {
                });
            } catch (IllegalArgumentException e) {
                log.error("Failed to read operators on template");
                throw e;
            }
            connection.getToConnector().setOperators(operatorOldDTOMapper.toEntityAll(toOperators));
        }

        return Wrapper.updated(template)
                .changed(true)
                .withOldVersion(oldVersion)
                .withNewVersion(updaterVersion.getVersion());
    }

    private Object resolveMethods(List<MethodWithDirectBody> methods) {
        if (methods == null || methods.isEmpty())
            return methods;

        return methods.stream()
                .map(method -> {
                    MethodDTO methodDTO = new MethodDTO();

                    methodDTO.setId(method.getNodeId());
                    methodDTO.setName(method.getName());
                    methodDTO.setColor(method.getColor());
                    methodDTO.setLabel(method.getLabel());
                    methodDTO.setIndex(method.getIndex());
                    methodDTO.setDataAggregator(method.getDataAggregator());
                    methodDTO.setRequest(resolveRequest(method.getRequest()));
                    methodDTO.setResponse(resolveResponse(method.getResponse()));

                    return methodDTO;
                })
                .toList();
    }

    private ResponseDTO resolveResponse(ResponseWithDirectBody response) {
        ResponseDTO responseDTO = new ResponseDTO();

        responseDTO.setFail(resolveResult(response.getFail()));
        responseDTO.setSuccess(resolveResult(response.getSuccess()));

        return responseDTO;
    }

    private RequestDTO resolveRequest(RequestWithDirectBody request) {
        RequestDTO requestDTO = new RequestDTO();

        requestDTO.setEndpoint(request.getEndpoint());
        requestDTO.setMethod(request.getMethod());
        requestDTO.setHeader(request.getHeader());
        requestDTO.setBody(resolveBody(request.getBody()));

        return requestDTO;
    }

    private ResultDTO resolveResult(ResultWithDirectBody result) {
        ResultDTO resultDTO = new ResultDTO();

        resultDTO.setStatus(result.getStatus());
        resultDTO.setHeader(result.getHeader());
        resultDTO.setBody(resolveBody(result.getBody()));

        return resultDTO;
    }

    private BodyDTO resolveBody(Map<String, Object> body) {
        if (body == null) {
            return null;
        }

        BodyDTO bodyDTO = new BodyDTO();
        if (body.containsKey("type")
                && body.containsKey("format")
                && body.containsKey("data") &&
                body.containsKey("fields")) {
            // normal body

            bodyDTO.setType(body.get("type").toString());
            bodyDTO.setFormat(body.get("format").toString());
            bodyDTO.setData(body.get("data").toString());

            bodyDTO.setFields((Map<String, Object>) body.get("fields"));
        } else {
            // direct body, without 'type', 'format', 'raw' and 'fields' fields

            // set default values
            bodyDTO.setType("object");
            bodyDTO.setFormat("json");
            bodyDTO.setData("raw");

            bodyDTO.setFields(body);
        }
        return bodyDTO;
    }
}
