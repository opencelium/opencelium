package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.FieldBindingRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FieldBindingMngServiceImp implements FieldBindingMngService {
    private final FieldBindingRepository fieldBindingRepository;

    public FieldBindingMngServiceImp(FieldBindingRepository fieldBindingRepository) {
        this.fieldBindingRepository = fieldBindingRepository;
    }

    @Override
    public List<FieldBindingMng> saveAll(List<FieldBindingMng> fieldBindings) {
        return fieldBindingRepository.saveAll(fieldBindings);
    }

    @Override
    public FieldBindingMng save(FieldBindingMng fieldBindingMng) {
        return fieldBindingRepository.save(fieldBindingMng);
    }

    @Override
    public Optional<FieldBindingMng> findById(String fieldBindingId) {
        return fieldBindingRepository.findById(fieldBindingId);
    }

    @Override
    public List<FieldBindingMng> findAllByEnhancementId(List<Integer> ids) {
        return fieldBindingRepository.findAllByEnhancementIdIn(ids);
    }

    @Override
    public void bind(ConnectionMng connectionMng) {
        List<FieldBindingMng> fieldBindings = connectionMng.getFieldBindings();
        ArrayList<MethodMng> methods = new ArrayList<>(connectionMng.getFromConnector().getMethods().size() + connectionMng.getToConnector().getMethods().size());
        methods.addAll(connectionMng.getFromConnector().getMethods());
        methods.addAll(connectionMng.getToConnector().getMethods());

        for (FieldBindingMng fb : fieldBindings) {
            FieldBindingMng savedFB = fieldBindingRepository.save(fb);
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
                        endpoint = putId(endpoint, fb.getFieldBindingId());
                        method.getRequest().setEndpoint(endpoint);
                    } else if (toField.getType().equals("header")) {
                        method.getRequest().getHeader().entrySet()
                                .stream()
                                .filter(entry -> entry.getValue().matches(".*\\{%.+%}.*"))
                                .findFirst()
                                .ifPresent(entry -> entry.setValue(putId(entry.getValue(), fb.getFieldBindingId())));
                    } else if (toField.getType().equals("request")) {
                        List<String> fieldPaths = new ArrayList<>(List.of(toField.getField().split("\\.")));
                        Map<String, Object> fields = method.getRequest().getBody().getFields();
                        Map<String, Object> boundFields = (Map<String, Object>) findAndBindField(fields, fieldPaths, fb.getFieldBindingId());
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
                        Map<String, Object> boundFields = (Map<String, Object>) findAndBindField(bodyMngToChange.getFields(), fieldPaths, fb.getFieldBindingId());
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
        if(name.endsWith("[*]"))
            name = name.replace("[*]","");

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
        return ref.replaceFirst("\\{%.+%}", "{%" + id + "%}");
    }
}
