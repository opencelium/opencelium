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

package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Component;
import com.becon.opencelium.backend.mysql.repository.ComponentRepository;
import com.becon.opencelium.backend.resource.user.ComponentResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ComponentServiceImpl implements ComponentService{

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private PermissionServiceImpl permissionService;

    @Override
    public Optional<Component> findById(int id) {
        return componentRepository.findById(id);
    }

    @Override
    public List<Component> findAll() {
        return componentRepository.findAll();
    }

//    @Override
//    public Component toEntity(ComponentResource componentResource) {
//        Component component = new Component();
//        component.setId(componentResource.getComponentId());
//        component.setName(componentResource.getName());
//        component.setDescription(componentResource.g);
//        return null;
//    }


    //
//    @Override
//    public List<ComponentResource> toResource(Set<RoleHasPermission> components, int roleId) {
//        return components.stream()
//                .map(c -> new ComponentResource(c.getComponent(), roleId)).collect(Collectors.toList());
//    }
}
