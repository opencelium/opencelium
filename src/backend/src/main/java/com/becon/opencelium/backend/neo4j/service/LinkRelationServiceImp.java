/*
 * // Copyright (C) <2019> <becon GmbH>
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

import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import com.becon.opencelium.backend.neo4j.entity.relation.LinkRelation;
import com.becon.opencelium.backend.neo4j.repository.LinkRelationRepository;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LinkRelationServiceImp implements LinkRelationService {

    @Autowired
    private LinkRelationRepository linkRelationRepository;

    @Autowired
    private FieldNodeServiceImp fieldNodeService;

    @Override
    public void saveAll(List<LinkRelation> linkRelations) {
        linkRelationRepository.saveAll(linkRelations);
    }

    @Override
    public List<LinkRelation> getLinkedFields(Long connectionId) {
        return linkRelationRepository.getLinkedRelationFields(connectionId);
    }

    @Override
    public List<LinkRelation> toEntity(List<FieldBindingResource> fieldBindingResources, Connection connection) {

        List<LinkRelation> linkRelations = new ArrayList<>();

        fieldBindingResources.forEach(l -> {

            LinkRelation linkRelation = new LinkRelation();
            if (l.getEnhancement() != null){
                return;
            }

            List<FieldNode> toFields = l.getTo().stream()
                    .map(f -> fieldNodeService.findFieldByResource(f, connection.getId())).collect(Collectors.toList());

            List<FieldNode> fromFields = l.getFrom().stream()
                    .map(f -> fieldNodeService.findFieldByResource(f, connection.getId())).collect(Collectors.toList());

            linkRelation.setFieldNodeEnd(toFields.get(0));
            linkRelation.setFieldNodeStart(fromFields.get(0));
            linkRelations.add(linkRelation);
        });
        return linkRelations;
    }
}
