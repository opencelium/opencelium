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

import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.repository.SessionRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.exception.UserNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public SessionServiceImpl(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Optional<Session> findById(String id) {
        return sessionRepository.findById(id);
    }

    @Override
    public void save(Session session) {
        sessionRepository.save(session);
    }

    @Override
    public Optional<Session> findByUserId(int userId) {
        return sessionRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public void deleteByUserId(int userId) {
        sessionRepository.deleteByUserId(userId);
    }

    /**
     * Replaces the user's session with a fresh one, serialized against other logins of the same
     * user.
     *
     * <p>{@code User.session} is an eager one-to-one resolved by {@code user_id}, so the entity
     * model tolerates exactly one {@code user_session} row per user. Two overlapping logins used
     * to be able to leave two rows behind: the delete ran immediately, but the insert was only
     * flushed on commit, after this method had returned and any JVM monitor had been released.
     * The user row is therefore locked first ({@code SELECT ... FOR UPDATE}), so a concurrent
     * call for the same user blocks until this transaction commits, and the insert is flushed
     * before returning so it executes while the lock is still held. The unique key
     * {@code uk_user_session_user_id} (changeset 5.2:1) backs this up at the database level.
     *
     * @throws UserNotFoundException if no user with {@code userId} exists
     */
    @Override
    @Transactional
    public Session replace(int userId) {
        userRepository.findOneById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        sessionRepository.deleteByUserId(userId);

        Session session = new Session();
        session.setId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setActive(true);
        session.setAttempts(0);

        return sessionRepository.saveAndFlush(session);
    }

    @Override
    @Transactional
    public void updateLastAccessedTime(String sessionId) {
        sessionRepository.updateLastAccessed(sessionId, new Date());
    }
}
