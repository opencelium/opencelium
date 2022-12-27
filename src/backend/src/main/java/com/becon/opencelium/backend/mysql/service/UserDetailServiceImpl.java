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

import com.becon.opencelium.backend.mysql.entity.UserDetail;
import com.becon.opencelium.backend.mysql.repository.UserDetailRepository;
import com.becon.opencelium.backend.resource.user.UserDetailResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserDetailServiceImpl implements UserDetailService {

    @Autowired
    private UserDetailRepository userDetailRepository;

    @Autowired
    private UserServiceImpl userService;

    @Override
    public void save(UserDetail userDetail) {
        userDetailRepository.save(userDetail);
    }

    @Override
    public boolean existsById(int id) {
        return userDetailRepository.existsById(id);
    }

    @Override
    public UserDetail toEntity(UserDetailResource resource) {
        if ((resource != null) && (resource.getBitbucketPassword() != null && !resource.getBitbucketPassword().isEmpty())){
            resource.setBitbucketPassword(userService.encodePassword(resource.getBitbucketPassword()));
        }

        if (resource != null && (resource.getBitbucketPassword() == null || resource.getBitbucketPassword().isEmpty())) {
//            UserDetail userDetail = userDetailRepository.findById()
//            resource.setBitbucketPassword();
        }
        return new UserDetail(resource);
    }

    @Override
    public UserDetailResource toResource(UserDetail entity) {
        return null;
    }
}
