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

import com.becon.opencelium.backend.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.mysql.repository.RoleHasPermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.Query;

@Service
public class RoleHasPermissionServiceImp implements RoleHasPermissionService {

    @Autowired
    private EntityManager em;

    @Autowired
    private RoleHasPermissionRepository repository;

    @Override
    public void delete(RoleHasPermission.RoleHasPermissionId id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByUserRole(UserRole roleId) {
        repository.deleteByUserRole(roleId);
    }

    public boolean existsById(RoleHasPermission.RoleHasPermissionId id) {
        return repository.existsById(id);
    }
}
