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

import com.becon.opencelium.backend.database.mysql.entity.Component;
import com.becon.opencelium.backend.database.mysql.entity.Permission;
import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.repository.UserRoleRepository;
import com.becon.opencelium.backend.exception.RoleExistsException;
import com.becon.opencelium.backend.exception.RoleNotFoundException;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.utility.FileNameUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class UserRoleServiceImpl implements UserRoleService {

    private final UserRoleRepository userRoleRepository;
    private final PermissionService permissionService;
    private final ComponentService componentService;
    private final StorageService storageService;

    public UserRoleServiceImpl(
            @Qualifier("permissionServiceImpl") PermissionService permissionService,
            @Qualifier("componentServiceImpl") ComponentService componentService,
            UserRoleRepository userRoleRepository,
            StorageService storageService
    ) {
        this.userRoleRepository = userRoleRepository;
        this.permissionService = permissionService;
        this.componentService = componentService;
        this.storageService = storageService;
    }

    @Override
    @Transactional(readOnly = true)
    public UserRoleResource getById(int id) {
        return findRole(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserRoleResource> getAll() {
        return userRoleRepository.findAll()
                .stream()
                .map(UserRoleResource::new)
                .toList();
    }

    @Override
    @Transactional
    public UserRoleResource create(UserRoleResource resource) {
        validateRoleName(resource.getName());

        UserRole role = new UserRole();
        updateFields(role, resource);
        addPermissions(role, resolvePermissions(resource));

        return new UserRoleResource(userRoleRepository.save(role));
    }

    @Override
    @Transactional
    public UserRoleResource updateComponents(int id, UserRoleResource resource) {
        UserRole role = getExistingRole(id);
        List<ResolvedPermission> requested = resolvePermissions(resource);
        Set<PermissionKey> requestedKeys = requested.stream()
                .map(ResolvedPermission::key)
                .collect(java.util.stream.Collectors.toSet());

        role.getComponents().stream()
                .filter(rolePermission -> !requestedKeys.contains(PermissionKey.from(rolePermission)))
                .toList()
                .forEach(role::removePermission);

        addPermissions(role, requested);

        return new UserRoleResource(role);
    }

    @Override
    @Transactional
    public UserRoleResource update(int id, UserRoleResource resource) {
        UserRole role = getExistingRole(id);
        validateRoleName(resource.getName(), role);
        updateFields(role, resource);

        return new UserRoleResource(role);
    }

    @Override
    @Transactional
    public void delete(int id) {
        UserRole role = getExistingRole(id);

        if (role.getIcon() != null) {
            storageService.delete(role.getIcon());
        }

        userRoleRepository.delete(role);
    }

    @Override
    @Transactional
    public void deleteAllByIds(List<Integer> ids) {
        Optional.ofNullable(ids)
                .orElseGet(Collections::emptyList)
                .stream()
                .filter(userRoleRepository::existsById)
                .forEach(this::delete);
    }

    @Override
    @Transactional
    public void deleteIcon(int id) {
        UserRole role = getExistingRole(id);

        if (role.getIcon() == null) {
            return;
        }

        storageService.delete(role.getIcon());
        role.setIcon(null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return userRoleRepository.existsByName(name);
    }

    @Override
    public Optional<UserRole> findByName(String name) {
        return userRoleRepository.findByName(name);
    }

    @Override
    @Transactional
    public void uploadIcon(int id, MultipartFile file) {
        String extension = FileNameUtils.getExtension(file.getOriginalFilename());

        if (!FileNameUtils.isSupportedImageExtension(extension)) {
            throw new StorageException("File should be jpg or png");
        }

        UserRole role = getExistingRole(id);

        String newFilename = UUID.randomUUID() + "." + extension;
        String oldFilename = role.getIcon();

        storageService.store(file, newFilename);

        role.setIcon(newFilename);
        userRoleRepository.save(role);

        if (oldFilename != null) {
            storageService.delete(oldFilename);
        }
    }


    private void updateFields(UserRole role, UserRoleResource resource) {
        role.setName(resource.getName());
        role.setDescription(resource.getDescription());
        role.setIcon(resource.getIcon());
    }

    private void addPermissions(UserRole role, List<ResolvedPermission> permissions) {
        permissions.forEach(resolved ->
                role.addPermission(resolved.component(), resolved.permission())
        );
    }

    private List<ResolvedPermission> resolvePermissions(UserRoleResource resource) {
        return Optional.ofNullable(resource.getComponents())
                .orElseGet(Collections::emptyList)
                .stream()
                .flatMap(componentResource -> {
                    Component component = componentService.findById(componentResource.getComponentId())
                            .orElseThrow();

                    return Optional.ofNullable(componentResource.getPermissions())
                            .orElseGet(Collections::emptySet)
                            .stream()
                            .map(permissionName -> new ResolvedPermission(
                                    component,
                                    permissionService.findByName(permissionName).orElseThrow()
                            ));
                })
                .distinct()
                .toList();
    }

    private record ResolvedPermission(Component component, Permission permission) {
        private PermissionKey key() {
            return new PermissionKey(component.getId(), permission.getId());
        }
    }

    private record PermissionKey(int componentId, int permissionId) {
        private static PermissionKey from(RoleHasPermission rolePermission) {
            return new PermissionKey(
                    rolePermission.getComponent().getId(),
                    rolePermission.getPermission().getId()
            );
        }
    }

    private UserRole getExistingRole(int id) {
        return userRoleRepository.findById(id)
                .orElseThrow(() -> new RoleNotFoundException(id));
    }

    private UserRoleResource findRole(int id) {
        return new UserRoleResource(getExistingRole(id));
    }

    private void validateRoleName(String name) {
        if (userRoleRepository.existsByName(name)) {
            throw new RoleExistsException(name);
        }
    }

    private void validateRoleName(String name, UserRole existing) {
        if (!existing.getName().equals(name) && userRoleRepository.existsByName(name)) {
            throw new RoleExistsException(name);
        }
    }
}
