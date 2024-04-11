/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.repository.EnhancementRepository;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EnhancementServiceImp implements EnhancementService {

    private final EnhancementRepository enhancementRepository;
    private final Mapper<Enhancement, EnhancementDTO> enhancementMapper;
    private final Mapper<EnhancementMng, EnhancementDTO> enhancementMngMapper;

    public EnhancementServiceImp(EnhancementRepository enhancementRepository, Mapper<Enhancement, EnhancementDTO> enhancementMapper, Mapper<EnhancementMng, EnhancementDTO> enhancementMngMapper) {
        this.enhancementRepository = enhancementRepository;
        this.enhancementMapper = enhancementMapper;
        this.enhancementMngMapper = enhancementMngMapper;
    }

    @Override
    public Enhancement save(Enhancement enhancement) {
        return enhancementRepository.save(enhancement);
    }

    @Override
    public List<Enhancement> saveAll(List<Enhancement> enhancement) {
        return enhancementRepository.saveAll(enhancement);
    }

    @Override
    public List<Enhancement> findAllByConnectionId(Long connectionId) {
        return enhancementRepository.findAllByConnectionId(connectionId);
    }

    @Override
    public void deleteAllByConnectionId(Long connectionId) {
        enhancementRepository.deleteByConnectionId(connectionId);
    }

    @Override
    public Enhancement getById(Integer id) {
        return enhancementRepository.findById(id)
                .orElseThrow(()->new RuntimeException("ENHANCEMENT_NOT_FOUND"));
    }


    @Override
    public Optional<Enhancement> findById(Integer enhId) {
        if (enhId == null) return Optional.empty();
        return enhancementRepository.findById(enhId);
    }

    @Override
    public void deleteAll(List<Integer> ids) {
        enhancementRepository.deleteAllById(ids);
    }

    @Override
    public boolean existById(Integer id) {
        return enhancementRepository.existsById(id);
    }

    @Override
    public void deleteById(Integer id) {
        enhancementRepository.deleteById(id);
    }

    public FieldBindingMng toFieldBinding(Enhancement enhancement) {
        FieldBindingMng fieldBindingMng = new FieldBindingMng();
        EnhancementMng enhancementMng = enhancementMngMapper.toEntity(enhancementMapper.toDTO(enhancement));
        fieldBindingMng.setEnhancementId(enhancement.getId());
        List<LinkedFieldMng> toField = Arrays.stream(enhancement.getArgs().split(";"))
                .filter(f -> f.contains("RESULT_VAR")).map(f -> (f.split("="))[1].trim())
                .map(f -> toLinkedFieldResource(f)).collect(Collectors.toList());
        List<LinkedFieldMng> fromField = Arrays.stream(enhancement.getArgs().split(";"))
                .filter(f -> !f.contains("RESULT_VAR")).map(f -> (f.split("="))[1].trim())
                .map(f -> toLinkedFieldResource(f)).collect(Collectors.toList());
        fieldBindingMng.setEnhancement(enhancementMng);
        fieldBindingMng.setFrom(fromField);
        fieldBindingMng.setTo(toField);
        return fieldBindingMng;
    }

    private LinkedFieldMng toLinkedFieldResource(String value) {
        return null;
    }

}
