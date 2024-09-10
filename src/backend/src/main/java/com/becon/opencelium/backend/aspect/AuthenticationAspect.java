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

package com.becon.opencelium.backend.aspect;

import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.service.SessionService;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuthenticationAspect {

    @Autowired
    private SessionService sessionService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @AfterReturning(pointcut = "execution(* com.becon.opencelium.backend.security.JwtTokenUtil.generateToken(com.becon.opencelium.backend.database.mysql.entity.User))",
                    returning = "token")
    public void afterTokenGeneration(String token){
        String sessionId = jwtTokenUtil.extractSessionId(token);
        int userId = jwtTokenUtil.extractUserId(token);

        // if 'user' already has a 'session' then delete it and create new one
        sessionService.deleteByUserId(userId);

        Session session = new Session();

        session.setId(sessionId);
        session.setUserId(userId);
        session.setActive(true);
        session.setAttempts(0);

        sessionService.save(session);
    }
}
