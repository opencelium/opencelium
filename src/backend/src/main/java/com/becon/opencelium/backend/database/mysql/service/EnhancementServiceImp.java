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

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.repository.EnhancementRepository;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EnhancementServiceImp implements EnhancementService {

    private final EnhancementRepository enhancementRepository;

    public EnhancementServiceImp(EnhancementRepository enhancementRepository) {
        this.enhancementRepository = enhancementRepository;
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
    public FieldBindingDTO toFieldBindingResource(Enhancement enhancement) {
        return null;
    }

    @Override
    public boolean existById(Integer id) {
        return enhancementRepository.existsById(id);
    }

    @Override
    public void deleteById(Integer id) {
        enhancementRepository.deleteById(id);
    }

}
