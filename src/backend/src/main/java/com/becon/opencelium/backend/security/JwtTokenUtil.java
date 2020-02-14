/*
 * // Copyright (C) <2019> <becon GmbH>
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

package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.constant.SecurityConstant;
import com.becon.opencelium.backend.mysql.entity.Activity;
import com.becon.opencelium.backend.mysql.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtTokenUtil {

    public String getEmailFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public String getTokenId(String token) {
        return getClaimFromToken(token, Claims::getId);
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public Object getClaim(String token, String name){
        final Claims claims = getAllClaimsFromToken(token);
        return claims.get(name);
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return  claimsResolver.apply(claims);
    }

    public String generateToken(UserPrincipals userDetails) {
        Map<String, Object> claims = new HashMap<>();
        User user = userDetails.getUser();
        String token = UUID.randomUUID().toString();

        claims.put("userId", user.getId());
        claims.put("role", user.getUserRole().getName());

        return doGenerateToken(claims, user.getEmail(), token);
    }

    public Boolean validateToken(String token, UserPrincipals userDetails) {
        Activity activity = userDetails.getUser().getActivity();
        String tokenId = getTokenId(token);
        if (activity.isLocked()){
            return false;
        }
        final String email = getEmailFromToken(token);

        long inactiveTime = new Date().getTime() - activity.getRequestTime().getTime();
        if (inactiveTime > SecurityConstant.ACTIVITY_TIME){
            return false;
        }

        return (email.equals(userDetails.getUsername())
                && !isTokenExpired(token)
                && tokenId.equals(activity.getTokenId()));
    }

    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser().setSigningKey(SecurityConstant.SECRET.getBytes()).parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }


    private String doGenerateToken(Map<String, Object> claims, String subject, String id) {
        return Jwts.builder()
                .setClaims(claims)
                .setId(id)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + SecurityConstant.EXPIRATION_TIME * 1000))
                .signWith(SignatureAlgorithm.HS512, SecurityConstant.SECRET.getBytes()).compact();
    }
}
