package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.repository.OperatorMngRepository;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.ocel.OCExpressionHelper;
import com.becon.opencelium.backend.ocel.Validator;
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
    private final Validator ocelValidator;

    public OperatorMngServiceImp(OperatorMngRepository operatorMngRepository, PatchHelper patchHelper, Mapper<OperatorMng, OperatorDTO> operatorMngMapper) {
        this.operatorMngRepository = operatorMngRepository;
        this.patchHelper = patchHelper;
        this.operatorMngMapper = operatorMngMapper;
        this.ocelValidator = Validator.defaultValidator();
    }

    @Override
    public List<OperatorMng> saveAll(List<OperatorMng> operators) {
        operators.forEach(this::validateExpression);
        return operatorMngRepository.saveAll(operators);
    }

    @Override
    public OperatorMng save(OperatorMng operatorMng) {
        validateExpression(operatorMng);
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
            validateExpression(toSave.getExpression(), toSave.getType());
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
            validateExpression(toSave.getExpression(), toSave.getType());
            OperatorMng saved = save(operatorMngMapper.toEntity(toSave));
            patched.getOperators().get(idx).setId(saved.getId());
        } else if (opDetail.isOperatorModified()) {
            int idx = patchHelper.getIndexOfList(opDetail.getIndexOfOperator(), patched.getOperators().size());
            List<OperatorDTO> operators = patched.getOperators();
            OperatorDTO toModify = operators.get(idx);
            validateExpression(toModify.getExpression(), toModify.getType());
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
                patched.getOperators().forEach(o -> validateExpression(o.getExpression(), o.getType()));
                patched.getOperators().forEach(o -> {
                    OperatorMng saved = save(operatorMngMapper.toEntity(o));
                    o.setId(saved.getId());
                });
            }
        }
    }

    private void validateExpression(OperatorMng operator) {
        validateExpression(operator.getExpression(), operator.getType());
    }

    private void validateExpression(String exp, String type) {
        if ("if".equals(type)) {
            ocelValidator.validate(exp);
        } else {
            OCExpressionHelper.validateLoopExp(exp);
        }
    }
}
