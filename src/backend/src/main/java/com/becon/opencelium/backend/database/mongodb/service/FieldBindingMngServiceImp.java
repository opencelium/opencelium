package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.FieldBindingRepository;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.base.MapperUpdatable;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.utility.BindingUtility;
import com.becon.opencelium.backend.utility.EndpointUtility;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FieldBindingMngServiceImp implements FieldBindingMngService {
    private final FieldBindingRepository fieldBindingRepository;
    private final MapperUpdatable<Enhancement, EnhancementDTO> enhancementMapper;
    private final Mapper<FieldBindingMng, FieldBindingDTO> fieldBindingMngMapper;
    private final MapperUpdatable<MethodMng, MethodDTO> methodMngMapper;
    private final EnhancementService enhancementService;
    private final PatchHelper patchHelper;
    private final MethodMngService methodMngService;

    public FieldBindingMngServiceImp(
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService,
            @Qualifier("methodMngServiceImp") MethodMngService methodMngService,
            FieldBindingRepository fieldBindingRepository,
            MapperUpdatable<Enhancement, EnhancementDTO> enhancementMapper,
            Mapper<FieldBindingMng, FieldBindingDTO> fieldBindingMngMapper,
            MapperUpdatable<MethodMng, MethodDTO> methodMngMapper,
            PatchHelper patchHelper) {
        this.fieldBindingRepository = fieldBindingRepository;
        this.enhancementMapper = enhancementMapper;
        this.fieldBindingMngMapper = fieldBindingMngMapper;
        this.enhancementService = enhancementService;
        this.methodMngMapper = methodMngMapper;
        this.patchHelper = patchHelper;
        this.methodMngService = methodMngService;
    }

    @Override
    public List<FieldBindingMng> saveAll(List<FieldBindingMng> fieldBindings) {
        fieldBindings.forEach(e -> e.setEnhancement(null));
        return fieldBindingRepository.saveAll(fieldBindings);
    }

    @Override
    public FieldBindingMng save(FieldBindingMng fieldBindingMng) {
        fieldBindingMng.setEnhancement(null);
        return fieldBindingRepository.save(fieldBindingMng);
    }

    @Override
    public Optional<FieldBindingMng> findById(String fieldBindingId) {
        return fieldBindingRepository.findById(fieldBindingId);
    }

    @Override
    public FieldBindingMng getById(String id) {
        return fieldBindingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ENHANCEMENT_NOT_FOUND"));
    }

    @Override
    public List<FieldBindingMng> findAllByEnhancementId(List<Integer> ids) {
        return fieldBindingRepository.findAllByEnhancementIdIn(ids);
    }

    @Override
    public void deleteById(String id) {
        delete(getById(id));
    }

    @Override
    public void delete(FieldBindingMng fb) {
        fieldBindingRepository.delete(fb);
    }

    @Override
    public void deleteAll(List<FieldBindingMng> fieldBindings) {
        fieldBindingRepository.deleteAll(fieldBindings);
    }

    public List<FieldBindingMng> getAllByConnectionId(Long connectionId) {
        List<FieldBindingMng> fieldBindingMngs = new ArrayList<>();
        List<Enhancement> enhancements = enhancementService.findAllByConnectionId(connectionId);
        if (enhancements!=null) {
            for (Enhancement enhancement : enhancements) {
                fieldBindingMngs.add(enhancementService.toFieldBinding(enhancement));
            }
        }
        return fieldBindingMngs;
    }

    @Override
    public void doWithPatchedEnhancement(ConnectionDTO connectionDTO, ConnectionDTO patched, PatchConnectionDetails.PatchOperationDetail opDetail) {
        if (opDetail.isEnhancementAdded()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), patched.getFieldBinding().size());
            List<FieldBindingDTO> fieldBindings = patched.getFieldBinding();
            FieldBindingDTO toSave = fieldBindings.get(idx);
            Enhancement enhancement = enhancementMapper.toEntity(toSave.getEnhancement());
            if (enhancement == null) {
                enhancement = new Enhancement();
            }
            enhancement.setConnection(new Connection(connectionDTO.getConnectionId()));
            enhancementService.save(enhancement);
            toSave.setEnhancementId(enhancement.getId());
            toSave.setId(null);
            FieldBindingMng saved = save(fieldBindingMngMapper.toEntity(toSave));
            patched.getFieldBinding().get(idx).setId(saved.getId());
            patched.getFieldBinding().get(idx).setEnhancementId(saved.getEnhancementId());
        } else if (opDetail.isEnhancementDeleted()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), connectionDTO.getFieldBinding().size());
            FieldBindingDTO fieldBindingDTO = connectionDTO.getFieldBinding().get(idx);
            enhancementService.deleteById(fieldBindingDTO.getEnhancementId());
            deleteById(fieldBindingDTO.getId());
        } else if (opDetail.isEnhancementModified()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), patched.getFieldBinding().size());
            List<FieldBindingDTO> fieldBindings = patched.getFieldBinding();
            FieldBindingDTO toModify = fieldBindings.get(idx);
            Enhancement enhancement;
            try {
                enhancement = enhancementService.getById(toModify.getEnhancementId());
            } catch (RuntimeException e) {
                enhancement = enhancementService.getById(connectionDTO.getFieldBinding().get(idx).getEnhancementId());
                toModify.setEnhancementId(enhancement.getId());
            }
            try {
                getById(toModify.getId());
            } catch (RuntimeException e) {
                toModify.setId(connectionDTO.getFieldBinding().get(idx).getId());
            }
            enhancementMapper.updateEntityFromDto(enhancement, toModify.getEnhancement());
            enhancementService.save(enhancement);
            save(fieldBindingMngMapper.toEntity(toModify));
        } else if (opDetail.isEnhancementReplaced()) {
            //deleting old enhancement
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), patched.getFieldBinding().size());
            FieldBindingDTO fb = connectionDTO.getFieldBinding().get(idx);
            enhancementService.deleteById(fb.getEnhancementId());
            deleteById(fb.getId());

            //saving new enhancement
            FieldBindingDTO toSave = patched.getFieldBinding().get(idx);
            Enhancement enhancement = enhancementMapper.toEntity(toSave.getEnhancement());
            enhancement.setConnection(new Connection(connectionDTO.getConnectionId()));
            enhancementService.save(enhancement);
            toSave.setEnhancementId(enhancement.getId());
            FieldBindingMng saved = save(fieldBindingMngMapper.toEntity(toSave));
            patched.getFieldBinding().get(idx).setId(saved.getId());
            patched.getFieldBinding().get(idx).setEnhancementId(saved.getEnhancementId());
        } else {
            //deleting old enhancements
            if (connectionDTO.getFieldBinding() != null) {
                connectionDTO.getFieldBinding().forEach(fb -> {
                    enhancementService.deleteById(fb.getEnhancementId());
                    deleteById(fb.getId());
                });
            }

            //saving new enhancements
            if (patched.getFieldBinding() != null) {
                patched.getFieldBinding().forEach(fb -> {
                    Enhancement enhancement = enhancementMapper.toEntity(fb.getEnhancement());
                    enhancement.setConnection(new Connection(patched.getConnectionId()));
                    enhancementService.save(enhancement);
                    fb.setEnhancementId(enhancement.getId());
                    FieldBindingMng saved = save(fieldBindingMngMapper.toEntity(fb));
                    fb.setId(saved.getId());
                });
            }
        }
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

        for (int i = 0; i < fieldBindings.size(); i++) {
            FieldBindingMng savedFB = save(fieldBindings.get(i)); // savepoint
            try {
                bindIds(savedFB, methods);
            } catch (Exception e) {
                for (int i1 = 0; i1 <= i; i1++) {
                    delete(fieldBindings.get(i1));
                }
                throw e;
            }
        }
    }

    @Override
    public void bindAfterUpdate(ConnectionMng connectionMng) {
        List<FieldBindingMng> fieldBindings = connectionMng.getFieldBindings();
        if (fieldBindings == null || fieldBindings.isEmpty()) {
            return;
        }
        List<MethodMng> methods = new ArrayList<>();
        if (connectionMng.getFromConnector() != null && connectionMng.getFromConnector().getMethods() != null) {
            methods.addAll(connectionMng.getFromConnector().getMethods());
        }
        if (connectionMng.getToConnector() != null && connectionMng.getToConnector().getMethods() != null) {
            methods.addAll(connectionMng.getToConnector().getMethods());
        }

        for (FieldBindingMng fieldBinding : fieldBindings) {
            bindIds(fieldBinding, methods);
        }
        methodMngService.saveAll(methods);
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

    private void bindIds(FieldBindingMng fb, List<MethodMng> methods) {
        for (LinkedFieldMng toField : fb.getTo()) {
            for (MethodMng method : methods) {
                if (toField.getColor().equals(method.getColor())) {
                    switch (toField.getType()) {
                        case "path" -> {
                            String endpoint = method.getRequest().getEndpoint();
                            endpoint = BindingUtility.doWithPath(endpoint, fb.getId(), fb.getFrom());
                            method.getRequest().setEndpoint(endpoint);
                        }
                        case "header" -> BindingUtility.doWithHeader(method.getRequest().getHeader(), toField.getField(), fb.getId(), fb.getFrom());
                        case "request" -> {
                            List<String> fieldPaths = EndpointUtility.splitByDot(toField.getField());
                            Map<String, Object> fields = method.getRequest().getBody().getFields();
                            Map<String, Object> boundFields = BindingUtility.doWithBody(fields, fieldPaths, fb.getId(), method.getRequest().getBody().getFormat());
                            method.getRequest().getBody().setFields(boundFields);
                        }
                        default -> throw new RuntimeException("UNSUPPORTED_TYPE: " + toField.getType());
                    }
                    break;
                }
            }
        }
    }
}