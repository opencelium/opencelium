package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.repository.MethodMngRepository;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MethodMngServiceImp implements MethodMngService {
    private final MethodMngRepository methodMngRepository;
    private final PatchHelper patchHelper;
    private final Mapper<MethodMng, MethodDTO> methodMngMapper;

    public MethodMngServiceImp(MethodMngRepository methodMngRepository, PatchHelper patchHelper, Mapper<MethodMng, MethodDTO> methodMngMapper) {
        this.methodMngRepository = methodMngRepository;
        this.patchHelper = patchHelper;
        this.methodMngMapper = methodMngMapper;
    }

    @Override
    public List<MethodMng> saveAll(List<MethodMng> methods) {
        return methodMngRepository.saveAll(methods);
    }

    @Override
    public MethodMng save(MethodMng methodMng) {
        return methodMngRepository.save(methodMng);
    }

    @Override
    public void deleteById(String id) {
        delete(getById(id));
    }

    @Override
    public void delete(MethodMng methodMng) {
        methodMngRepository.delete(methodMng);
    }

    @Override
    public MethodMng getById(String id) {
        return methodMngRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("METHOD_NOT_FOUND"));
    }


    @Override
    public void deleteAll(List<MethodMng> methods) {
        methodMngRepository.deleteAllById(methods.stream().map(MethodMng::getId).toList());
    }

    @Override
    public String getNameByCode(String methodKey) {
        MethodMng methodMng = methodMngRepository.findByColor(methodKey)
                .orElseThrow(() -> new RuntimeException("METHOD_NOT_FOUND"));
        return methodMng.getName();
    }

    @Override
    public void doWithPatchedMethod(ConnectorDTO connectorDTO, ConnectorDTO patched, PatchConnectionDetails.PatchOperationDetail opDetail) {
        if (opDetail.isMethodAdded()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfMethod(), patched.getMethods().size());
            MethodDTO toSave = patched.getMethods().get(idx);
            toSave.setId(null);
            MethodMng saved = save(methodMngMapper.toEntity(toSave));
            patched.getMethods().get(idx).setId(saved.getId());
        } else if (opDetail.isMethodDeleted()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfMethod(), connectorDTO.getMethods().size());
            deleteById(connectorDTO.getMethods().get(idx).getId());
        } else if (opDetail.isMethodReplaced()) {
            //deleting old method
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfMethod(), patched.getMethods().size());
            deleteById(connectorDTO.getMethods().get(idx).getId());

            //saving new method
            MethodDTO toSave = patched.getMethods().get(idx);
            MethodMng saved = save(methodMngMapper.toEntity(toSave));
            patched.getMethods().get(idx).setId(saved.getId());
        } else if (opDetail.isMethodModified()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfMethod(), patched.getMethods().size());
            List<MethodDTO> methods = patched.getMethods();
            MethodDTO toModify = methods.get(idx);
            try {
                getById(toModify.getId());
            } catch (RuntimeException e) {
                toModify.setId(connectorDTO.getMethods().get(idx).getId());
            }
            save(methodMngMapper.toEntity(toModify));
        } else {
            //deleting old methods
            if (connectorDTO != null && connectorDTO.getMethods() != null) {
                connectorDTO.getMethods().forEach(m -> deleteById(m.getId()));
            }

            //saving new methods
            if (patched != null && patched.getMethods() != null) {
                patched.getMethods().forEach(m -> {
                    MethodMng saved = save(methodMngMapper.toEntity(m));
                    m.setId(saved.getId());
                });
            }
        }
    }
}
