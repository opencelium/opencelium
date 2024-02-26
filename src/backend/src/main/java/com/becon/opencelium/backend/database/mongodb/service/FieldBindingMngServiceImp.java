package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.RegExpression;
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
import com.becon.opencelium.backend.resource.connection.MethodDTO;
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
    private final MapperUpdatable<MethodMng, MethodDTO> methodMngMapper;
    private final EnhancementService enhancementService;
    private final PatchHelper patchHelper;

    public FieldBindingMngServiceImp(
            FieldBindingRepository fieldBindingRepository,
            EnhancementServiceImp enhancementService,
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

        for (FieldBindingMng fb : fieldBindings) {
            FieldBindingMng savedFB = save(fb);
            bindIds(savedFB, methods);
        }
    }

    @Override
    public void bind(List<FieldBindingMng> fieldBindings, List<MethodMng> methods) {
        if (fieldBindings == null || fieldBindings.isEmpty()) {
            return;
        }
        for (FieldBindingMng fb : fieldBindings) {
            FieldBindingMng savedFB = save(fb);
            bindIds(savedFB, methods);
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
        detach(methodMngs, fbMngs);
        for (int i = 0; i < methods.size(); i++) {
            methodMngMapper.updateDtoFromEntity(methods.get(i), methodMngs.get(i));
        }
    }

    @Override
    public void detach(List<MethodMng> methods, List<FieldBindingMng> fbs) {
        for (MethodMng method : methods) {
            if (method != null) {
                if (method.getRequest() != null && method.getRequest().getBody() != null) {
                    Map<String, Object> fields = method.getRequest().getBody().getFields();
                    for (Map.Entry<String, Object> entry : fields.entrySet()) {
                        entry.setValue(findRefAndReplace(entry.getValue(), fbs));
                    }
                }
                if (method.getResponse() != null && method.getResponse() != null) {
                    if (method.getResponse().getFail() != null && method.getResponse().getFail().getBody() != null) {
                        Map<String, Object> fields = method.getResponse().getFail().getBody().getFields();
                        for (Map.Entry<String, Object> entry : fields.entrySet()) {
                            entry.setValue(findRefAndReplace(entry.getValue(), fbs));
                        }
                    }
                    if (method.getResponse().getSuccess() != null && method.getResponse().getSuccess().getBody() != null) {
                        Map<String, Object> fields = method.getResponse().getSuccess().getBody().getFields();
                        for (Map.Entry<String, Object> entry : fields.entrySet()) {
                            entry.setValue(findRefAndReplace(entry.getValue(), fbs));
                        }
                    }
                }
            }
        }
    }

    private Object findRefAndReplace(Object obj, List<FieldBindingMng> fieldBinding) {
        if (obj instanceof String str) {
            if (str.matches(RegExpression.enhancement)) {
                String id = str.replace("#{%", "")
                        .replace("%}", "");

                obj = getRefOfFB(id, fieldBinding);
            }
        } else if (obj instanceof List<?> list) {
            List<Object> objects = new ArrayList<>();
            for (Object o : list) {
                objects.add(findRefAndReplace(o, fieldBinding));
            }
            obj = objects;
        } else if (obj instanceof Map<?, ?> map) {
            Map<String, Object> res = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                res.put((String) entry.getKey(), findRefAndReplace(entry.getValue(), fieldBinding));
            }
            obj = res;
        }
        return obj;
    }

    private String getRefOfFB(String id, List<FieldBindingMng> fieldBinding) {
        for (FieldBindingMng fb : fieldBinding) {
            if (fb.getId().equals(id)) {
                StringBuilder sb = new StringBuilder();
                for (LinkedFieldMng from : fb.getFrom()) {
                    sb.append(from.getColor())
                            .append(".(")
                            .append(from.getType())
                            .append(").")
                            .append(from.getField())
                            .append(" ");
                }
                sb.deleteCharAt(sb.length() - 1);
                return sb.toString();
            }
        }
        throw new RuntimeException("ENHANCEMENT_NOT_FOUND");
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
        if (fieldPaths.isEmpty()) {
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

    private String putId(String ref, String id) {
        return "#{%" + id + "%}";
    }
}
