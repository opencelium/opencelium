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

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.resource.request.UserRequestResource;
import com.becon.opencelium.backend.resource.user.UserResource;

import java.util.List;
import java.util.Optional;

public interface UserService {

    Optional<User> findByEmail(String email);

    Optional<User> findById(int id);

    void save(User user);

    boolean existsByEmail(String email);

    boolean existsById(int id);

    void deleteById(int id);

    List<User> findAll();

    User fromResource(UserResource userResource);

    User requestToEntity(UserRequestResource userRequestResource);

    UserResource toResource(User entity);

    User toEntity(UserResource resource);

    String encodePassword(String password);

    User getCurrentUser();
}
