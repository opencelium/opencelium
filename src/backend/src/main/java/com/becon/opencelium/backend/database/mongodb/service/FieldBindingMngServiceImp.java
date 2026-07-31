package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.exception.FieldTypeMismatchException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.base.MapperUpdatable;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.utility.BindingUtility;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FieldBindingMngServiceImp implements FieldBindingMngService {
    private static final Logger log = LogManager.getLogger(FieldBindingMngServiceImp.class);

    private final Mapper<FieldBindingMng, FieldBindingDTO> fieldBindingMngMapper;
    private final MapperUpdatable<MethodMng, MethodDTO> methodMngMapper;
    private final MongoTemplate mongoTemplate;

    public FieldBindingMngServiceImp(
            Mapper<FieldBindingMng, FieldBindingDTO> fieldBindingMngMapper,
            MapperUpdatable<MethodMng, MethodDTO> methodMngMapper, MongoTemplate mongoTemplate
    ) {
        this.fieldBindingMngMapper = fieldBindingMngMapper;
        this.methodMngMapper = methodMngMapper;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void bind(ConnectionMng connectionMng) {
        List<FieldBindingMng> fieldBindings = connectionMng.getFieldBindings();
        if (fieldBindings == null || fieldBindings.isEmpty()) {
            return;
        }
        ArrayList<MethodMng> methods = new ArrayList<>();
        if (connectionMng.getFromConnector() != null && connectionMng.getFromConnector().getMethods() != null) {
            methods.addAll(connectionMng.getFromConnector().getMethods());
        }
        if (connectionMng.getToConnector() != null && connectionMng.getToConnector().getMethods() != null) {
            methods.addAll(connectionMng.getToConnector().getMethods());
        }

        for (FieldBindingMng fieldBinding : fieldBindings) {
            bindIds(fieldBinding, methods);
        }
    }

    @Override
    public void detach(ConnectionDTO connectionDTO) {
        List<MethodDTO> methods = new ArrayList<>();
        if (connectionDTO.getFromConnector() != null && connectionDTO.getFromConnector().getMethods() != null) {
            methods.addAll(connectionDTO.getFromConnector().getMethods());
        }
        if (connectionDTO.getToConnector() != null && connectionDTO.getToConnector().getMethods() != null) {
            methods.addAll(connectionDTO.getToConnector().getMethods());
        }
        List<FieldBindingMng> fbMngs = fieldBindingMngMapper.toEntityAll(connectionDTO.getFieldBinding());
        List<MethodMng> methodMngs = methodMngMapper.toEntityAll(methods);
        BindingUtility.detach(methodMngs, fbMngs);
        for (int i = 0; i < methods.size(); i++) {
            methodMngMapper.updateDtoFromEntity(methods.get(i), methodMngs.get(i));
        }
    }

    @Override
    public void deleteAll() {
        mongoTemplate.dropCollection("field_binding");
    }

    private void bindIds(FieldBindingMng fb, List<MethodMng> methods) {
        for (LinkedFieldMng toField : fb.getTo()) {
            for (MethodMng method : methods) {
                if (toField.getColor().equals(method.getColor())) {
                    String type = PathAndReferenceUtility.getPlaceTypeOfRef(toField.getField());
                    switch (type) {
                        case "path" -> {
                            String endpoint = method.getRequest().getEndpoint();
                            endpoint = BindingUtility.doWithPath(endpoint, fb.getId(), fb.getFrom());
                            method.getRequest().setEndpoint(endpoint);
                        }
                        case "header" -> {
                            String fieldName = PathAndReferenceUtility.getHeaderParameterName(toField.getField());
                            BindingUtility.doWithHeader(method.getRequest().getHeader(), fieldName, fb.getId(), fb.getFrom());
                        }
                        case "body" -> {
                            String field = PathAndReferenceUtility.getActualPathOfBody(toField.getField());
                            List<String> fieldPaths = PathAndReferenceUtility.splitByDelimiter(field, '.', true, true);
                            try {
                                Map<String, Object> boundFields = BindingUtility.doWithBody(method.getRequest().getBody(), fieldPaths, fb.getId(), method.getRequest().getBody().getFormat());
                                method.getRequest().getBody().setFields(boundFields);
                            } catch (FieldTypeMismatchException e) {
                                FieldTypeMismatchException enriched = e.withFieldPath(toField.getField());
                                log.error("Failed to bind field '{}' on method '{}' [{}]: {}", toField.getField(), method.getName(), method.getColor(), enriched.getMessage(), e);
                                throw enriched;
                            }
                        }
                        default -> throw new RuntimeException("UNSUPPORTED_TYPE: " + type);
                    }
                    break;
                }
            }
        }
    }
}