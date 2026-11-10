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

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRoleRepository;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.ServiceUnavailableException;
import com.becon.opencelium.backend.exception.UserNotFoundException;
import com.becon.opencelium.backend.resource.ChangePasswordDTO;
import com.becon.opencelium.backend.resource.request.UserRequestResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.utility.EmailUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

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

    @Autowired
    private StorageService storageService;

    private Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsernameAndAuthMethod(username, AuthMethod.LDAP);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findById(int id) {
        return userRepository.findOneById(id);
    }

    @Override
    public Optional<User> findByIdNoLock(int id) {
        return userRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public User getById(Integer userId) {
        return findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
    }

    @Override
    @Transactional
    public User save(User user) {
        String email = user.getEmail();

        if (email != null && !EmailUtility.isValid(email)) {
            throw new IllegalArgumentException("Invalid email is supplied");
        }

        if (user.getAuthMethod() == AuthMethod.BASIC && email == null) {
            throw new IllegalArgumentException("Email is required for BASIC users");
        }

        user.setUsername(normalizeUsername(user));

        return userRepository.save(user);
    }

    /**
     * Returns the username to persist: trimmed, {@code null} when blank, and for OC users checked
     * against the rules that make it a login identifier.
     *
     * <p>Blank must become {@code null} because the unique key {@code uk_user_username}
     * (changeset 5.2:2) tolerates any number of {@code NULL}s but only one empty string, and the
     * user wizard sends an empty string for every user without a username. LDAP usernames are
     * owned by the directory and may look like anything, including an email address, so only their
     * whitespace is normalized. An OC username may not contain {@code '@'}: at login an
     * email-shaped identifier is resolved as an email, so such a username could never sign in and
     * could only block the first login of an LDAP account that authenticates with that address.
     * Uniqueness spans both auth methods and is case-insensitive through the column collation.
     *
     * @throws GeneralServiceException with {@link ExceptionConstant#USERNAME_INVALID} or
     *     {@link ExceptionConstant#USERNAME_ALREADY_EXIST}
     */
    private String normalizeUsername(User user) {
        String username = user.getUsername();
        if (username == null || username.isBlank()) {
            return null;
        }
        username = username.trim();

        if (user.getAuthMethod() != AuthMethod.LDAP && username.contains("@")) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.USERNAME_INVALID,
                    "Username must not contain '@'");
        }

        if (userRepository.existsByUsernameAndIdNot(username, user.getId())) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.USERNAME_ALREADY_EXIST,
                    "Username '" + username + "' is already taken");
        }

        return username;
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
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
    @Transactional
    public User requestToEntity(UserRequestResource userRequestResource) {
        User user = new User();
        User userDb = userRepository.findById(userRequestResource.getUserId()).orElse(null);
        UserRole userRole = userRoleRepository.findById(userRequestResource.getUserGroup()).orElse(null);
        if ((userDb == null) && (userRequestResource.getPassword() == null || userRequestResource.getPassword().isEmpty())) {
            throw new RuntimeException("PASSWORD_IS_NULL");
        }

        if ((userDb != null) && (userRequestResource.getPassword() != null && !userRequestResource.getPassword().isEmpty())) {
            user.setPassword(encodePassword(userRequestResource.getPassword()));
        }

        if (userDb != null && (userRequestResource.getPassword() == null || userRequestResource.getPassword().isEmpty())) {
            user.setPassword(userDb.getPassword());
        }

        if (userDb != null) {
            userRequestResource.getUserDetail().setProfilePicture(userDb.getUserDetail().getProfilePicture());
        }

        if (userDb == null && (userRequestResource.getPassword() != null || userRequestResource.getPassword().isEmpty())) {
            String encPass = userRequestResource.getPassword();
            user.setPassword(encodePassword(encPass));
        }

        UserDetail userDetail = detailService.toEntity(userRequestResource.getUserDetail());
        Session session = sessionService.findByUserId(userRequestResource.getUserId()).orElse(null);

        user.setId(userRequestResource.getUserId());
        user.setUserRole(userRole);
        user.setSession(session);
        user.setEmail(userRequestResource.getEmail());
        user.setUserDetail(userDetail);
        if (userDb != null) {
            user.setAuthMethod(userDb.getAuthMethod());
            user.setTotpProcessCompleted(userDb.isTotpProcessCompleted());
            user.setTotpSecretKey(userDb.getTotpSecretKey());
        }

        if (user.getAuthMethod() != AuthMethod.LDAP) {
            user.setUsername(userRequestResource.getUsername());
        } else {
            // LDAP owns the username: ignore the request's value and keep the stored one.
            // userDb is never null here — a user can only be LDAP once persisted as such.
            user.setUsername(userDb.getUsername());
            logger.warn("Ldap user detected. Username {} can't be modified.", userDb.getUsername());
        }

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

    /**
     * Returns the user behind the current security context, re-read by id so that callers inside
     * a transaction get a managed entity ({@link #changePassword(ChangePasswordDTO)} relies on
     * dirty checking), or {@code null} when no user is authenticated.
     *
     * @throws UserNotFoundException if the authenticated user has been deleted meanwhile
     */
    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipals principals) {
            int id = principals.getUser().getId();
            return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        }
        return null;
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordDTO dto) {
        User user = getCurrentUser();

        if (user.getAuthMethod() == AuthMethod.LDAP) {
            throw new ServiceUnavailableException(ExceptionConstant.PASSWORD_MANAGED_EXTERNALLY, "Password is managed externally.");
        }

        if (!bCryptPasswordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.WRONG_PASSWORD, "wrong password");
        }

        user.setPassword(encodePassword(dto.newPassword()));
    }

    @Override
    @Transactional
    public void deleteProfilePicture(int id) {
        User user = findById(id).orElseThrow(() -> new UserNotFoundException(id));
        UserDetail userDetail = user.getUserDetail();

        if (userDetail == null || userDetail.getProfilePicture() == null) {
            return;
        }

        String filename = userDetail.getProfilePicture();

        // Clear the reference first so a failing file deletion rolls the column back
        // together with the transaction instead of leaving a dangling picture URL.
        userDetail.setProfilePicture(null);
        detailService.save(userDetail);

        storageService.delete(filename);
    }
}
