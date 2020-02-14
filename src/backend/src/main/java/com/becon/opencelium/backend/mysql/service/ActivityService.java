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

import com.becon.opencelium.backend.mysql.entity.Activity;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.security.UserPrincipals;

import java.util.Optional;

public interface ActivityService {

    void save(Activity activity);

    Optional<Activity> findById(int id);

    void registerTokenActivity(UserPrincipals userDetails);
}
