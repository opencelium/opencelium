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

import com.becon.opencelium.backend.database.mysql.entity.Activity;
import com.becon.opencelium.backend.database.mysql.repository.ActivityRepository;
import com.becon.opencelium.backend.security.UserPrincipals;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;

@Service
public class ActivityServiceImpl implements ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Override
    public void save(Activity activity) {
        activityRepository.save(activity);
    }

    @Override
    public Optional<Activity> findById(int id) {
        return activityRepository.findById(id);
    }

    @Override
    public void registerTokenActivity(UserPrincipals userDetails) {
        Activity activity = userDetails.getUser().getActivity();
        activity.setLocked(false);
        activity.setRequestTime(new Date());
        activityRepository.save(activity);
    }
}
