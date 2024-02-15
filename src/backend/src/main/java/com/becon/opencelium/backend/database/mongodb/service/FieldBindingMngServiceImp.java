package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.FieldBindingRepository;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.database.mysql.service.EnhancementServiceImp;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.base.MapperUpdatable;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FieldBindingMngServiceImp implements FieldBindingMngService {
    private final FieldBindingRepository fieldBindingRepository;
    private final MapperUpdatable<Enhancement, EnhancementDTO> enhancementMapper;
    private final Mapper<FieldBindingMng, FieldBindingDTO> fieldBindingMngMapper;
    private final EnhancementService enhancementService;
    private final PatchHelper patchHelper;

    public FieldBindingMngServiceImp(
            FieldBindingRepository fieldBindingRepository,
            EnhancementServiceImp enhancementService,
            MapperUpdatable<Enhancement, EnhancementDTO> enhancementMapper,
            Mapper<FieldBindingMng, FieldBindingDTO> fieldBindingMngMapper,
            PatchHelper patchHelper) {
        this.fieldBindingRepository = fieldBindingRepository;
        this.enhancementMapper = enhancementMapper;
        this.fieldBindingMngMapper = fieldBindingMngMapper;
        this.enhancementService = enhancementService;
        this.patchHelper = patchHelper;
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

    @Override
    public void doWithPatchedEnhancement(ConnectionDTO connectionDTO, ConnectionDTO patched, PatchConnectionDetails.PatchOperationDetail opDetail) {
        if (opDetail.isEnhancementAdded()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), patched.getFieldBindings().size());
            List<FieldBindingDTO> fieldBindings = patched.getFieldBindings();
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
            patched.getFieldBindings().get(idx).setId(saved.getId());
            patched.getFieldBindings().get(idx).setEnhancementId(saved.getEnhancementId());
        } else if (opDetail.isEnhancementDeleted()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), connectionDTO.getFieldBindings().size());
            FieldBindingDTO fieldBindingDTO = connectionDTO.getFieldBindings().get(idx);
            enhancementService.deleteById(fieldBindingDTO.getEnhancementId());
            deleteById(fieldBindingDTO.getId());
        } else if (opDetail.isEnhancementModified()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), patched.getFieldBindings().size());
            List<FieldBindingDTO> fieldBindings = patched.getFieldBindings();
            FieldBindingDTO toModify = fieldBindings.get(idx);
            Enhancement enhancement;
            try {
                enhancement = enhancementService.getById(toModify.getEnhancementId());
            } catch (RuntimeException e) {
                enhancement = enhancementService.getById(connectionDTO.getFieldBindings().get(idx).getEnhancementId());
                toModify.setEnhancementId(enhancement.getId());
            }
            try {
                getById(toModify.getId());
            } catch (RuntimeException e) {
                toModify.setId(connectionDTO.getFieldBindings().get(idx).getId());
            }
            enhancementMapper.updateEntityFromDto(enhancement, toModify.getEnhancement());
            enhancementService.save(enhancement);
            save(fieldBindingMngMapper.toEntity(toModify));
        } else if (opDetail.isEnhancementReplaced()) {
            //deleting old enhancement
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), patched.getFieldBindings().size());
            FieldBindingDTO fb = connectionDTO.getFieldBindings().get(idx);
            enhancementService.deleteById(fb.getEnhancementId());
            deleteById(fb.getId());

            //saving new enhancement
            FieldBindingDTO toSave = patched.getFieldBindings().get(idx);
            Enhancement enhancement = enhancementMapper.toEntity(toSave.getEnhancement());
            enhancement.setConnection(new Connection(connectionDTO.getConnectionId()));
            enhancementService.save(enhancement);
            toSave.setEnhancementId(enhancement.getId());
            FieldBindingMng saved = save(fieldBindingMngMapper.toEntity(toSave));
            patched.getFieldBindings().get(idx).setId(saved.getId());
            patched.getFieldBindings().get(idx).setEnhancementId(saved.getEnhancementId());
        } else {
            //deleting old enhancements
            if (connectionDTO.getFieldBindings() != null) {
                connectionDTO.getFieldBindings().forEach(fb -> {
                    enhancementService.deleteById(fb.getEnhancementId());
                    deleteById(fb.getId());
                });
            }

            //saving new enhancements
            if (patched.getFieldBindings() != null) {
                patched.getFieldBindings().forEach(fb -> {
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
        ArrayList<MethodMng> methods = new ArrayList<>();
        methods.addAll(connectionMng.getFromConnector().getMethods());
        methods.addAll(connectionMng.getToConnector().getMethods());

        for (FieldBindingMng fb : fieldBindings) {
            FieldBindingMng savedFB = save(fb);
            bindIds(savedFB, methods);
        }
    }

    @SuppressWarnings("unchecked")
    private List<MethodMng> bindIds(FieldBindingMng fb, List<MethodMng> methods) {
        for (LinkedFieldMng toField : fb.getTo()) {
            for (MethodMng method : methods) {
                if (toField.getColor().equals(method.getColor())) {
                    if (toField.getType().equals("path")) {
                        String endpoint = method.getRequest().getEndpoint();
                        endpoint = putId(endpoint, fb.getId());
                        method.getRequest().setEndpoint(endpoint);
                    } else if (toField.getType().equals("header")) {
                        method.getRequest().getHeader().entrySet()
                                .stream()
                                .filter(entry -> entry.getValue().matches(".*\\{%.+%}.*"))
                                .findFirst()
                                .ifPresent(entry -> entry.setValue(putId(entry.getValue(), fb.getId())));
                    } else if (toField.getType().equals("request")) {
                        List<String> fieldPaths = new ArrayList<>(List.of(toField.getField().split("\\.")));
                        Map<String, Object> fields = method.getRequest().getBody().getFields();
                        Map<String, Object> boundFields = (Map<String, Object>) findAndBindField(fields, fieldPaths, fb.getId());
                        method.getRequest().getBody().setFields(boundFields);
                    } else {
                        List<String> fieldPaths = new ArrayList<>(List.of(toField.getField().split("\\.")));
                        fieldPaths.remove(0);
                        BodyMng bodyMngToChange;
                        if (toField.getField().startsWith("success")) {
                            bodyMngToChange = method.getResponse().getSuccess().getBody();
                        } else {
                            bodyMngToChange = method.getResponse().getFail().getBody();
                        }
                        Map<String, Object> boundFields = (Map<String, Object>) findAndBindField(bodyMngToChange.getFields(), fieldPaths, fb.getId());
                        bodyMngToChange.setFields(boundFields);
                    }
                    break;
                }
            }
        }
        return methods;
    }

    private Object findAndBindField(Map<String, Object> fields, List<String> fieldPaths, String id) {
        Map<String, Object> resultMap = new HashMap<>();
        String name = fieldPaths.get(0);
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            if (name.equals(entry.getKey()) || name.endsWith("[*]") && name.startsWith(entry.getKey())) {
                fieldPaths.remove(0);
                resultMap.put(entry.getKey(), process(entry.getValue(), fieldPaths, id));
            } else {
                resultMap.put(entry.getKey(), entry.getValue());
            }
        }
        return resultMap;
    }

    @SuppressWarnings("unchecked")
    private Object process(Object value, List<String> fieldPaths, String id) {
        if (fieldPaths.size() == 0) {
            String stringVal = (String) value;
            return putId(stringVal, id);
        }
        String name = fieldPaths.get(0);
        if (name.endsWith("[*]"))
            name = name.replace("[*]", "");

        if (name.matches(".+\\[\\w+]")) {
            if (fieldPaths.size() == 1) {
                List<String> stringList = (List<String>) value;
                List<String> res = new ArrayList<>();
                for (String s : stringList) {
                    res.add(putId(s, id));
                }
                return res;
            } else {
                List<Map<String, Object>> mapList = (List<Map<String, Object>>) value;
                List<Map<String, Object>> res = new ArrayList<>();
                for (Map<String, Object> map : mapList) {
                    res.add(dealWithMapOfFields(map, fieldPaths, id));
                }
                return res;
            }
        } else {
            Map<String, Object> map = (Map<String, Object>) value;
            return dealWithMapOfFields(map, fieldPaths, id);
        }
    }

    private Map<String, Object> dealWithMapOfFields(Map<String, Object> src, List<String> fieldPaths, String id) {
        String name = fieldPaths.get(0);
        Map<String, Object> resultMap = new HashMap<>();
        for (Map.Entry<String, Object> entry : src.entrySet()) {
            if (name.startsWith(entry.getKey())) {
                fieldPaths.remove(0);
                resultMap.put(entry.getKey(), process(entry.getValue(), fieldPaths, id));
            } else {
                resultMap.put(entry.getKey(), entry.getValue());
            }
        }
        return resultMap;
    }

    private String putId(String ref, String id){
        return "#{%" + id + "%}";
    }
}
