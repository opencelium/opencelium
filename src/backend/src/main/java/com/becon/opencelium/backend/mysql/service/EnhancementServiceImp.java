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

package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mysql.repository.EnhancementRepository;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.neo4j.service.EnhancementNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.FieldNodeServiceImp;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementResource;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingResource;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EnhancementServiceImp implements EnhancementService{

    @Autowired
    private EnhancementRepository enhancementRepository;

    @Autowired
    private EnhancementNodeServiceImp enhancementNodeService;

    @Autowired
    private FieldNodeServiceImp fieldNodeService;

    @Override
    public void save(Enhancement enhancement) {
        enhancementRepository.save(enhancement);
    }

    @Override
    public void saveAll(List<Enhancement> enhancement) {
        enhancementRepository.saveAll(enhancement);
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
    public Enhancement findByFieldId(Long fieldId) {
        EnhancementNode enhancementNode = enhancementNodeService.findByFieldId(fieldId)
                .orElseThrow(() -> new RuntimeException("Field(" + fieldId + ") not found"));
        return enhancementRepository.findById(enhancementNode.getEnhanceId())
                .orElseThrow(() -> new RuntimeException("Enhancement " + enhancementNode.getEnhanceId() + " not found in MariaDB"));
    }

    @Override
    public Optional<Enhancement> findById(Integer enhId) {
        return enhancementRepository.findById(enhId);
    }

    @Override
    public void deleteAll(List<Enhancement> enhancements) {

        enhancements.forEach(e -> enhancementRepository.deleteById(e.getId()));
    }

    @Override
    public Enhancement toEntity(EnhancementResource resource) {
        Enhancement enhancement = new Enhancement();
        enhancement.setId(resource.getEnhanceId());
        enhancement.setDescription(resource.getDescription());
        enhancement.setName(resource.getName());
        enhancement.setExpertCode(resource.getExpertCode());
        enhancement.setExpertVar(resource.getExpertVar());
        enhancement.setLanguage(resource.getLanguage());
        enhancement.setSimpleCode("");
        return enhancement;
    }

    @Override
    public EnhancementResource toResource(Enhancement entity) {
        return new EnhancementResource(entity);
    }

    @Override
    public FieldBindingResource toFieldBindingResource(Enhancement enhancement) {
        FieldBindingResource fieldBindingResource = new FieldBindingResource();
        EnhancementResource enhancementResource = new EnhancementResource(enhancement);
//        EnhancementNode enhancementNode = enhancementNodeService.findByEnhanceId(enhancement.getId())
//                .orElseThrow(()-> new RuntimeException("Enhancement: " + enhancement.getId() +" not found"));
//        List<LinkedFieldResource> toField = enhancementNode.getOutgoingField().stream()
//                .map(fieldNode -> fieldNodeService.toLinkedFieldResource(fieldNode)).collect(Collectors.toList());
//        List<LinkedFieldResource> fromField = enhancementNode.getIncomeField().stream()
//                .map(fieldNode -> fieldNodeService.toLinkedFieldResource(fieldNode)).collect(Collectors.toList());
        List<LinkedFieldResource> toField = Arrays.stream(enhancement.getExpertVar().split(";"))
                .filter(f -> f.contains("RESULT_VAR")).map(f -> (f.split("="))[1].trim())
                .map(f -> fieldNodeService.toLinkedFieldResource(f)).collect(Collectors.toList());
        List<LinkedFieldResource> fromField = Arrays.stream(enhancement.getExpertVar().split(";"))
                .filter(f -> !f.contains("RESULT_VAR")).map(f -> (f.split("="))[1].trim())
                .map(f -> fieldNodeService.toLinkedFieldResource(f)).collect(Collectors.toList());
        fieldBindingResource.setEnhancement(enhancementResource);
        fieldBindingResource.setFrom(fromField);
        fieldBindingResource.setTo(toField);
        return fieldBindingResource;
    }

}
