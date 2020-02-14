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

import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.resource.user.UserRoleResource;

import java.util.List;
import java.util.Optional;

public interface UserRoleService {

    boolean existsById(int id);

    void save(UserRole userRole);

    Optional<UserRole> findById(int id);

    List<UserRole> findAll();

    UserRole getOne(int id);

    boolean existsByRole(String role);

    void deleteById(int id);

    UserRole toEntity(UserRoleResource resource);

    UserRoleResource toResource(UserRole entity);
}
