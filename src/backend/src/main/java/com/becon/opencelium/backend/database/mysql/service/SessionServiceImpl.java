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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionServiceImpl implements SessionService {

    @Autowired
    private SessionRepository sessionRepository;

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

    @Override
    @Transactional
    public synchronized Session replace(int userId) {
        // delete existing session for this user
        sessionRepository.deleteByUserId(userId);

        // create new session
        String sessionId = UUID.randomUUID().toString();

        Session session = new Session();
        session.setId(sessionId);
        session.setUserId(userId);
        session.setActive(true);
        session.setAttempts(0);

        return sessionRepository.save(session);
    }

    @Override
    @Transactional
    public synchronized void updateLastAccessedTime(String sessionId) {
        sessionRepository.updateLastAccessed(sessionId, new Date());
    }
}
