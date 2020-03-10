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

package com.becon.opencelium.backend.neo4j.service;

import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import com.becon.opencelium.backend.neo4j.repository.EnhancementNodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EnhancementNodeServiceImp implements EnhancementNodeService {

    @Autowired
    private EnhancementNodeRepository enhancementNodeRepository;

    @Override
    public void save(EnhancementNode enhancementNode) {
        enhancementNodeRepository.save(enhancementNode);
    }

    @Override
    public void saveAll(List<EnhancementNode> enhancementNodes) {
        enhancementNodeRepository.saveAll(enhancementNodes);
    }

    @Override
    public Optional<EnhancementNode> findByEnhanceId(Integer enhanceId) {
        return enhancementNodeRepository.findOptionalByEnhanceId(enhanceId);
    }

    @Override
    public Optional<EnhancementNode> findByFieldId(Long fieldId) {
        return enhancementNodeRepository.findByFieldId(fieldId);
    }

    @Override
    public List<EnhancementNode> findAllByConnectionId(Long connectionId) {
        return enhancementNodeRepository.findAllByConnectionId(connectionId);
    }
}
