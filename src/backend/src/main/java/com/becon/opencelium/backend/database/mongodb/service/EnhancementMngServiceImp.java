package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import org.springframework.stereotype.Service;

@Service
public class EnhancementMngServiceImp implements EnhancementMngService{

    @Override
    public EnhancementMng toEntity(EnhancementDTO enhancementDTO) {
        EnhancementMng enhancementMng = new EnhancementMng();
        enhancementMng.setEnhancementId(enhancementDTO.getEnhanceId());
        enhancementMng.setExpertVar(enhancementDTO.getExpertVar());
        enhancementMng.setLanguage(enhancementDTO.getLanguage());
        enhancementMng.setExpertCode(enhancementDTO.getExpertCode());
        enhancementMng.setDescription(enhancementDTO.getDescription());
        enhancementMng.setName(enhancementDTO.getName());
        return enhancementMng;
    }
    @Override
    public Enhancement toEntity(EnhancementMng enhancementMng) {
        Enhancement enhancement = new Enhancement();
        enhancement.setId(enhancementMng.getEnhancementId());
        enhancement.setDescription(enhancementMng.getDescription());
        enhancement.setName(enhancementMng.getName());
        enhancement.setExpertCode(enhancementMng.getExpertCode());
        enhancement.setExpertVar(enhancementMng.getExpertVar());
        enhancement.setLanguage(enhancementMng.getLanguage());
        return enhancement;
    }


    @Override
    public EnhancementDTO toDTO(EnhancementMng enhancementMng) {
        EnhancementDTO enhancementDTO = new EnhancementDTO();
        enhancementDTO.setEnhanceId(enhancementMng.getEnhancementId());
        enhancementDTO.setName(enhancementMng.getName());
        enhancementDTO.setDescription(enhancementMng.getDescription());
        enhancementDTO.setLanguage(enhancementMng.getLanguage());
        enhancementDTO.setExpertCode(enhancementMng.getExpertCode());
        enhancementDTO.setExpertVar(enhancementMng.getExpertVar());
        return enhancementDTO;
    }
}
