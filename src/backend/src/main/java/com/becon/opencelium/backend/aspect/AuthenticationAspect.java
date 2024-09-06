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

import com.becon.opencelium.backend.database.mysql.entity.Activity;
import com.becon.opencelium.backend.database.mysql.service.ActivityServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;

@Aspect
@Component
public class AuthenticationAspect {

    @Autowired
    private ActivityServiceImpl activityService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserServiceImpl userService;

    @AfterReturning(pointcut = "execution(* com.becon.opencelium.backend.security.JwtTokenUtil.generateToken(com.becon.opencelium.backend.security.UserPrincipals))",
                    returning = "token")
    public void afterTokenGeneration(String token){
        String tokenId = jwtTokenUtil.getTokenId(token);
        String userId = jwtTokenUtil.getClaim(token, "userId").toString();
        Activity activity = new Activity();
        activity.setId(Integer.parseInt(userId));
        activity.setTokenId(tokenId);
        activity.setLocked(false);
        activity.setRequestTime(new Date());
        activityService.save(activity);
    }
}
