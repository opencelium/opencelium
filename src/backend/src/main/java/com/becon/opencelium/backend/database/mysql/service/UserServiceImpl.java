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

import com.becon.opencelium.backend.database.mysql.entity.*;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRoleRepository;
import com.becon.opencelium.backend.resource.request.UserRequestResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService{

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Lazy
    @Autowired
    private UserDetailServiceImpl detailService;

    @Autowired
    private SessionServiceImpl sessionService;

    @Autowired
    private WidgetSettingServiceImp widgetSettingServiceImp;

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> findById(int id) {
        return userRepository.findOneById(id);
    }

    @Override
    public void save(User user) {
        userRepository.save(user);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsById(int id) {
        return userRepository.existsById(id);
    }

    @Override
    public void deleteById(int id) {
        userRepository.deleteOneById(id);
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public User fromResource(UserResource userResource) {
        return null;
    }

    @Override
    public User requestToEntity(UserRequestResource userRequestResource) {
        User user = new User();
        User userDb = userRepository.findById(userRequestResource.getUserId()).orElse(null);
        UserRole userRole = userRoleRepository.findById(userRequestResource.getUserGroup()).orElse(null);
        if ((userDb == null) && (userRequestResource.getPassword() == null || userRequestResource.getPassword().isEmpty())){
            throw new RuntimeException("PASSWORD_IS_NULL");
        }

        if ((userDb != null) && (userRequestResource.getPassword() != null && !userRequestResource.getPassword().isEmpty())){
            user.setPassword(encodePassword(userRequestResource.getPassword()));
        }

        if (userDb != null && (userRequestResource.getPassword() == null || userRequestResource.getPassword().isEmpty())){
            user.setPassword(userDb.getPassword());
        }

        if (userDb != null){
            userRequestResource.getUserDetail().setProfilePicture(userDb.getUserDetail().getProfilePicture());
        }

        if (userDb == null && (userRequestResource.getPassword() != null || userRequestResource.getPassword().isEmpty())) {
            String encPass = userRequestResource.getPassword();
            user.setPassword(encodePassword(encPass));
        }

        UserDetail userDetail = detailService.toEntity(userRequestResource.getUserDetail());
        Session session = sessionService.findById(userRequestResource.getUserId()).orElse(null);

        user.setId(userRequestResource.getUserId());
        user.setUserRole(userRole);
        user.setSession(session);
        user.setEmail(userRequestResource.getEmail());
        user.setUserDetail(userDetail);

        userDetail.setId(userRequestResource.getUserId());
        userDetail.setUser(user);

        return user;
    }

    @Override
    public UserResource toResource(User entity) {
        return new UserResource(entity);
    }

    @Override
    public User toEntity(UserResource resource) {

        List<WidgetSetting> widgetSettings = resource.getWidgetSettings().stream()
                .map(wsr -> widgetSettingServiceImp.toEntity(wsr, resource.getUserId())).collect(Collectors.toList());
        return new User(resource, widgetSettings);
    }

    @Override
    public String encodePassword(String password) {
        return bCryptPasswordEncoder.encode(password);
    }

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails userDetails) {
            return findByEmail(userDetails.getUsername()).get();
        }
        return null;
    }
}
