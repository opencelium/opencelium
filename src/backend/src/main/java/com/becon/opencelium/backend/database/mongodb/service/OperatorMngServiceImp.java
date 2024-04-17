package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.repository.OperatorMngRepository;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OperatorMngServiceImp implements OperatorMngService {
    private final OperatorMngRepository operatorMngRepository;
    private final PatchHelper patchHelper;
    private final Mapper<OperatorMng, OperatorDTO> operatorMngMapper;

    public OperatorMngServiceImp(OperatorMngRepository operatorMngRepository, PatchHelper patchHelper, Mapper<OperatorMng, OperatorDTO> operatorMngMapper) {
        this.operatorMngRepository = operatorMngRepository;
        this.patchHelper = patchHelper;
        this.operatorMngMapper = operatorMngMapper;
    }

    @Override
    public List<OperatorMng> saveAll(List<OperatorMng> operators) {
        return operatorMngRepository.saveAll(operators);
    }

    @Override
    public OperatorMng save(OperatorMng operatorMng) {
        return operatorMngRepository.save(operatorMng);
    }

    @Override
    public void deleteById(String id) {
        delete(getById(id));
    }

    @Override
    public void delete(OperatorMng operatorMng) {
        operatorMngRepository.delete(operatorMng);
    }

    @Override
    public OperatorMng getById(String id) {
        return operatorMngRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("OPERATOR_NOT_FOUND"));
    }

    @Override
    public void deleteAll(List<OperatorMng> operators) {
        operatorMngRepository.deleteAllById(operators.stream().map(OperatorMng::getId).toList());
    }

    @Override
    public void doWithPatchedOperator(ConnectorDTO connectorDTO, ConnectorDTO patched, PatchConnectionDetails.PatchOperationDetail opDetail) {
        if (opDetail.isOperatorAdded()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfOperator(), patched.getOperators().size());
            OperatorDTO toSave = patched.getOperators().get(idx);
            toSave.setId(null);
            OperatorMng saved = save(operatorMngMapper.toEntity(toSave));
            patched.getOperators().get(idx).setId(saved.getId());
        } else if (opDetail.isOperatorDeleted()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfOperator(), connectorDTO.getOperators().size());
            deleteById(connectorDTO.getOperators().get(idx).getId());
        } else if (opDetail.isOperatorReplaced()) {
            //deleting old operator
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfOperator(), patched.getOperators().size());
            deleteById(connectorDTO.getOperators().get(idx).getId());

            //saving new operator
            OperatorDTO toSave = patched.getOperators().get(idx);
            OperatorMng saved = save(operatorMngMapper.toEntity(toSave));
            patched.getOperators().get(idx).setId(saved.getId());
        } else if (opDetail.isOperatorModified()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfOperator(), patched.getOperators().size());
            List<OperatorDTO> operators = patched.getOperators();
            OperatorDTO toModify = operators.get(idx);
            try {
                getById(toModify.getId());
            } catch (RuntimeException e) {
                toModify.setId(connectorDTO.getOperators().get(idx).getId());
            }
            save(operatorMngMapper.toEntity(toModify));
        } else {
            //deleting old operators
            if (connectorDTO != null && connectorDTO.getOperators() != null) {
                connectorDTO.getOperators().forEach(o -> deleteById(o.getId()));
            }

            //saving new operators
            if (patched != null && patched.getOperators() != null) {
                patched.getOperators().forEach(o -> {
                    OperatorMng saved = save(operatorMngMapper.toEntity(o));
                    o.setId(saved.getId());
                });
            }
        }
    }
}
