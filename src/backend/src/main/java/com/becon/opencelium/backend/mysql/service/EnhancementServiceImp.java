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
import com.becon.opencelium.backend.resource.connection.binding.EnhancementResource;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingResource;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EnhancementServiceImp implements EnhancementService{

    @Autowired
    private EnhancementRepository enhancementRepository;

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
        return null;
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
        return null;
    }

}
