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

import com.becon.opencelium.backend.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.mysql.repository.UserRoleRepository;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserRoleServiceImpl implements UserRoleService {

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PermissionServiceImpl permissionService;

    @Autowired
    private ComponentServiceImpl componentService;

    @Override
    public boolean existsById(int id) {
        return userRoleRepository.existsById(id);
    }

    @Override
    public Optional<UserRole> findById(int id) {
        return userRoleRepository.findById(id);
    }

    @Override
    public List<UserRole> findAll() {
        return userRoleRepository.findAll();
    }

    @Override
    public UserRole getOne(int id) {
        return userRoleRepository.getOne(id);
    }

    @Override
    public boolean existsByRole(String role) {
        return false;
    }

    @Override
    public void deleteById(int id) {
        userRoleRepository.deleteById(id);
    }

    @Override
    public UserRole toEntity(UserRoleResource resource) {

        UserRole role = new UserRole();

        role.setId(resource.getGroupId());
        role.setName(resource.getName());
        role.setDescription(resource.getDescription());
        role.setIcon(resource.getIcon());

        Set<RoleHasPermission> components = resource.getComponents()
                .stream()
                .flatMap(c -> c.getPermissions()
                        .stream()
                        .map(p -> new RoleHasPermission(
                                        role,
                                        componentService.findById(c.getComponentId()).get(),
                                        permissionService.findByName(p).get()
                                )
                        )
                ).collect(Collectors.toSet());
        role.setComponents(components);
        return role;
    }
    @Override
    public void save(UserRole userRole) {
        userRoleRepository.save(userRole);
    }

    @Override
    public UserRoleResource toResource(UserRole entity) {
//        List<ComponentResource> componentResource = componentService.toResource(entity.getComponents(), entity.getId());
//        resource.setComponents(componentResource);
        return new UserRoleResource(entity);
    }
}
