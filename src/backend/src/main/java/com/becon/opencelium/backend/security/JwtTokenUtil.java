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

package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.utility.TokenUtility;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtTokenUtil {

    @Autowired
    private TokenUtility tokenUtility;

    public String extractEmail(String token) {
        return getClaimFromToken(token, JWTClaimsSet::getSubject);
    }

    public String extractSessionId(String token) {
        return getClaimFromToken(token, JWTClaimsSet::getJWTID);
    }

    public int extractUserId(String token) {
        String userId = getClaim(token, "userId").toString();

        return Integer.parseInt(userId);
    }

    public Date extractExpirationDate(String token) {
        return getClaimFromToken(token, JWTClaimsSet::getExpirationTime);
    }

    public <T> T getClaimFromToken(String token, Function<JWTClaimsSet, T> claimsResolver) {
        final JWTClaimsSet claims = getAllClaimsFromToken(token);
        return  claimsResolver.apply(claims);
    }

    public String generateToken(UserPrincipals userDetails) {
        User user = userDetails.getUser();
        String sessionId = UUID.randomUUID().toString();

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
            .claim("userId", user.getId())
            .claim("role", user.getUserRole().getName())
            .claim("sessionTime", tokenUtility.getActivityTime())
            .expirationTime(new Date(System.currentTimeMillis() + tokenUtility.getExpirationTime() * 1000))
            .issueTime(new Date(System.currentTimeMillis()))
            .subject(user.getEmail())
            .jwtID(sessionId)
            .build();

        return generateToken(claimsSet);
    }

    public Boolean validateToken(String token, UserPrincipals userDetails) throws Exception {

        SignedJWT signedJWT = SignedJWT.parse(token);
        // Create HMAC verifier
        JWSVerifier verifier = new MACVerifier(tokenUtility.getSecret());
        if (!signedJWT.verify(verifier)) {
            return false;
        }

        Session session = userDetails.getUser().getSession();
        if (!session.isActive()){
            return false;
        }

        long inactiveTime = new Date().getTime() - session.getLastAccessed().getTime();
        if (inactiveTime > tokenUtility.getActivityTime()){
            return false;
        }

        final String sessionId = extractSessionId(token);
        final String email = extractEmail(token);

        return (email.equals(userDetails.getUsername())
                && !isTokenExpired(token)
                && sessionId.equals(session.getId()));
    }

    public JWTClaimsSet getAllClaimsFromToken(String token) {
        try {
            return SignedJWT.parse(token).getJWTClaimsSet();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String generateToken(JWTClaimsSet claims) {
        try {
            MACSigner signer = new MACSigner(tokenUtility.getSecret());
            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims); // Create signed JWT
            signedJWT.sign(signer); // Sign the JWT

            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    private Object getClaim(String token, String name){
        final JWTClaimsSet claims = getAllClaimsFromToken(token);
        return claims.getClaim(name);
    }

    private Boolean isTokenExpired(String token) {
        final Date expiration = extractExpirationDate(token);
        return expiration.before(new Date());
    }
}
